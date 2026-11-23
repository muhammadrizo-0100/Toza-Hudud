import { Logger } from '@nestjs/common';
import { Markup } from 'telegraf';
import { RequestsService } from '../requests/requests.service';
import { RequestStatus } from '../../database/entities/request.entity';
import { WorkerSession } from './bot.types';
import { WORKER_KEYBOARD, CANCEL_KEYBOARD } from './bot-keyboards.helper';
import { downloadTelegramFile } from './bot-file.helper';
import { WorkerAuthService } from './worker-auth.service';

export async function sendWorkerTasks(ctx: any, workerId: number, requestsService: RequestsService): Promise<void> {
  const tasks = await requestsService.findAssignedToWorker(workerId);
  if (tasks.length === 0) {
    await ctx.reply(
      `🎉 <b>Hozirda sizga biriktirilgan faol vazifalar yo‘q.</b>\n` +
      `Yangi topshiriq biriktirilganda darhol sizga xabar beriladi!`,
      { parse_mode: 'HTML' }
    );
    return;
  }

  await ctx.reply(`🚛 <b>Sizga biriktirilgan faol vazifalar (${tasks.length} ta):</b>`, {
    parse_mode: 'HTML'
  });

  for (const t of tasks) {
    let caption =
      `📌 <b>Murojaat #${t.id}</b>\n` +
      `📍 <b>Manzil:</b> ${t.mahallaName || ''}, ${t.address || 'Aniq manzil kiritilmagan'}\n` +
      `🗑 <b>Chiqindi turi:</b> ${t.wasteType || 'Maishiy'}\n` +
      `⏰ <b>Biriktirilgan vaqt:</b> ${t.assignedAt ? new Date(t.assignedAt).toLocaleString('uz-UZ') : '-'}\n` +
      `👤 <b>Murojaatchi:</b> ${t.citizenFullName || 'Fuqaro'} (${t.citizenPhone || '-'})\n`;

    if (t.description) caption += `💬 <b>Izoh:</b> ${t.description}\n`;

    const inlineButtons: any[] = [
      [Markup.button.callback('📸 Tozalangan rasmni yuklash', `done_${t.id}`)]
    ];
    if (t.lat && t.lng) {
      inlineButtons[0].push(Markup.button.url('🗺 Xaritada ochish', `https://maps.google.com/?q=${t.lat},${t.lng}`));
    }

    await ctx.reply(caption, {
      parse_mode: 'HTML',
      reply_markup: { inline_keyboard: inlineButtons }
    });
  }
}

export async function handleWorkerReportAction(
  ctx: any,
  reqId: number,
  fromId: number,
  sessions: Map<number, WorkerSession>,
  requestsService: RequestsService,
  workerAuthService: WorkerAuthService
): Promise<void> {
  let request;
  try {
    request = await requestsService.findOne(reqId);
  } catch {
    await ctx.answerCbQuery('Topshiriq topilmadi!', { show_alert: true });
    return;
  }

  if (!request) {
    await ctx.answerCbQuery('Topshiriq topilmadi!', { show_alert: true });
    return;
  }

  if (request.status === RequestStatus.COMPLETED) {
    await ctx.answerCbQuery('Bu topshiriq allaqachon dispetcher tomonidan tasdiqlangan va yakunlangan!', { show_alert: true });
    await ctx.editMessageReplyMarkup({ inline_keyboard: [] }).catch(() => {});
    await ctx.reply(`✅ <b>Topshiriq #${reqId} allaqachon muvaffaqiyatli yakunlangan.</b>`, {
      parse_mode: 'HTML',
      reply_markup: WORKER_KEYBOARD.reply_markup
    });
    return;
  }

  if (request.status === RequestStatus.SUBMITTED) {
    await ctx.answerCbQuery('Hisobot fotosurati allaqachon qabul qilingan!', { show_alert: true });
    await ctx.editMessageReplyMarkup({ inline_keyboard: [] }).catch(() => {});
    await ctx.reply(
      `⏳ <b>Topshiriq #${reqId} bo‘yicha hisobot fotosurati allaqachon topshirilgan va dispetcher tasdig‘i kutilmoqda.</b>\n\nQayta hisobot yuborish talab etilmaydi.`,
      { parse_mode: 'HTML', reply_markup: WORKER_KEYBOARD.reply_markup }
    );
    return;
  }

  if (request.status !== RequestStatus.IN_PROGRESS && request.status !== RequestStatus.REJECTED) {
    await ctx.answerCbQuery('Topshiriq faol holatda emas!', { show_alert: true });
    await ctx.editMessageReplyMarkup({ inline_keyboard: [] }).catch(() => {});
    return;
  }

  const { admin, worker } = await workerAuthService.findWorkerOrAdminByTelegramId(String(fromId));
  const workerId = worker?.id || admin?.workerId;
  if (workerId && request.assignedWorkerId && request.assignedWorkerId !== workerId) {
    await ctx.answerCbQuery('Bu topshiriq sizga biriktirilmagan!', { show_alert: true });
    return;
  }

  sessions.set(fromId, { step: 'await_after_photo', activeRequestId: reqId });
  await ctx.answerCbQuery();
  await ctx.reply(
    `📸 <b>Murojaat #${reqId} bo‘yicha tozalash ishlari bajarilganini tasdiqlovchi fotosuratni yuboring:</b>`,
    { parse_mode: 'HTML', reply_markup: CANCEL_KEYBOARD.reply_markup }
  );
}

export async function handleWorkerPhotoSubmission(
  ctx: any,
  fromId: number,
  session: WorkerSession,
  sessions: Map<number, WorkerSession>,
  requestsService: RequestsService,
  logger: Logger
): Promise<void> {
  const reqId = session.activeRequestId!;
  let request;
  try {
    request = await requestsService.findOne(reqId);
  } catch {
    sessions.delete(fromId);
    await ctx.reply('Topshiriq topilmadi.', { reply_markup: WORKER_KEYBOARD.reply_markup });
    return;
  }

  if (request.status === RequestStatus.COMPLETED) {
    sessions.delete(fromId);
    await ctx.reply(`✅ <b>Topshiriq #${reqId} allaqachon dispetcher tomonidan yakunlangan!</b>\nQayta fotosurat yuklash shart emas.`, {
      parse_mode: 'HTML',
      reply_markup: WORKER_KEYBOARD.reply_markup
    });
    return;
  }

  if (request.status === RequestStatus.SUBMITTED) {
    sessions.delete(fromId);
    await ctx.reply(`⏳ <b>Topshiriq #${reqId} bo‘yicha hisobot fotosurati allaqachon qabul qilingan va dispetcher tasdig‘i kutilmoqda.</b>\nQayta fotosurat yuborish talab etilmaydi.`, {
      parse_mode: 'HTML',
      reply_markup: WORKER_KEYBOARD.reply_markup
    });
    return;
  }

  if (request.status !== RequestStatus.IN_PROGRESS && request.status !== RequestStatus.REJECTED) {
    sessions.delete(fromId);
    await ctx.reply(`⚠️ Ushbu topshiriq faol jarayonda emas.`, { reply_markup: WORKER_KEYBOARD.reply_markup });
    return;
  }

  const photos = ctx.message.photo;
  const highestRes = photos[photos.length - 1];

  try {
    const fileLink = await ctx.telegram.getFileLink(highestRes.file_id);
    const savedPath = await downloadTelegramFile(fileLink.href);

    await requestsService.submitWork(reqId, savedPath);
    sessions.delete(fromId);

    await ctx.reply(
      `🎉 <b>Rahmat! Murojaat #${reqId} bo‘yicha tozalash fotosurati qabul qilindi.</b>\n\n` +
      `Murojaat muvaffaqiyatli topshirildi va dispetcher tasdig‘iga yuborildi.`,
      { parse_mode: 'HTML', reply_markup: WORKER_KEYBOARD.reply_markup }
    );
  } catch (err: any) {
    logger.error('Xodim rasmini saqlashda xatolik:', err);
    const msg = err?.message || 'Rasmni yuklashda xatolik yuz berdi. Iltimos qaytadan yuboring.';
    await ctx.reply(msg, { reply_markup: WORKER_KEYBOARD.reply_markup });
  }
}

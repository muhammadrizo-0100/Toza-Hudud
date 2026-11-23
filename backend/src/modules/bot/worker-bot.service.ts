import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Telegraf } from 'telegraf';
import { RequestsService } from '../requests/requests.service';
import { AdminEntity } from '../../database/entities/admin.entity';
import { WorkerEntity } from '../../database/entities/worker.entity';
import { WorkerSession } from './bot.types';
import { WORKER_KEYBOARD, GUEST_KEYBOARD, CANCEL_KEYBOARD } from './bot-keyboards.helper';
import { safeDeleteIncomingTextMessage } from './bot-file.helper';
import { WorkerAuthService } from './worker-auth.service';
import {
  sendWorkerTasks,
  handleWorkerReportAction,
  handleWorkerPhotoSubmission
} from './worker-tasks.helper';

@Injectable()
export class WorkerBotService {
  private readonly logger = new Logger(WorkerBotService.name);

  constructor(
    private readonly requestsService: RequestsService,
    private readonly workerAuthService: WorkerAuthService,
    @InjectRepository(AdminEntity)
    private readonly adminRepo: Repository<AdminEntity>,
    @InjectRepository(WorkerEntity)
    private readonly workerRepo: Repository<WorkerEntity>
  ) {}

  registerHandlers(bot: Telegraf, workerSessions: Map<number, WorkerSession>): void {
    bot.start(async (ctx) => {
      const fromId = ctx.from?.id;
      if (!fromId) return;

      const { admin, worker } = await this.workerAuthService.findWorkerOrAdminByTelegramId(String(fromId));
      if (admin || worker) {
        const name = admin?.fullName || worker?.fullName || 'Xodim';
        const role = admin?.jobTitle || admin?.role || worker?.role || 'Xodim';
        await ctx.reply(
          `Assalomu alaykum, hurmatli <b>${name}</b>!\n🏢 <b>Lavozim:</b> <i>${role}</i>\nSiz "Toza Hudud" tizimida avtorizatsiyadan o‘tgansiz.`,
          { parse_mode: 'HTML', reply_markup: WORKER_KEYBOARD.reply_markup }
        );
        const workerId = worker?.id || admin?.workerId;
        if (workerId) await sendWorkerTasks(ctx, workerId, this.requestsService);
      } else {
        workerSessions.delete(fromId);
        await ctx.reply(
          `🌿 <b>Assalomu alaykum! "Toza Hudud" xizmati xodimlari botiga xush kelibsiz.</b>\n\n` +
          `Botdan foydalanish uchun tizimdagi shaxsiy <b>Login</b> va <b>Parol</b>ingiz orqali kiring:`,
          { parse_mode: 'HTML', reply_markup: GUEST_KEYBOARD.reply_markup }
        );
      }
    });

    bot.command(['login', 'signin'], async (ctx) => this.workerAuthService.beginWorkerLogin(ctx, workerSessions));
    bot.hears(/^(🔑 Xodim sifatida kirish|Xodim sifatida kirish|Kirish|\/login|\/signin)$/i, async (ctx) =>
      this.workerAuthService.beginWorkerLogin(ctx, workerSessions)
    );

    bot.command(['logout', 'signout'], async (ctx) => this.workerAuthService.logoutWorker(ctx, workerSessions));
    bot.hears(/^(🚪 Tizimdan chiqish|Tizimdan chiqish|Chiqish|\/logout|\/signout)$/i, async (ctx) =>
      this.workerAuthService.logoutWorker(ctx, workerSessions)
    );

    bot.hears(/^(🚛 Biriktirilgan vazifalarim|Biriktirilgan vazifalarim|Vazifalarim)$/i, async (ctx) => {
      const fromId = ctx.from?.id;
      if (!fromId) return;
      const { admin, worker } = await this.workerAuthService.findWorkerOrAdminByTelegramId(String(fromId));
      const workerId = worker?.id || admin?.workerId;
      if (!workerId) {
        await ctx.reply(`Siz hali tizimda avtorizatsiyadan o‘tmagansiz. Iltimos, /login buyrug‘ini bosing.`, {
          reply_markup: GUEST_KEYBOARD.reply_markup
        });
        return;
      }
      await sendWorkerTasks(ctx, workerId, this.requestsService);
    });

    bot.hears(/^(📊 Mening hisobotlarim|Mening hisobotlarim|Hisobotlarim)$/i, async (ctx) => this.handleMyReports(ctx));

    bot.hears(/^(❌ Bekor qilish|Bekor qilish|\/cancel)$/i, async (ctx) => {
      const fromId = ctx.from?.id;
      if (fromId) workerSessions.delete(fromId);
      const { admin, worker } = fromId
        ? await this.workerAuthService.findWorkerOrAdminByTelegramId(String(fromId))
        : { admin: null, worker: null };
      await ctx.reply(`Amal bekor qilindi.`, {
        reply_markup: admin || worker ? WORKER_KEYBOARD.reply_markup : GUEST_KEYBOARD.reply_markup
      });
    });

    bot.action(/done_(\d+)/, async (ctx) => {
      const fromId = ctx.from?.id;
      if (!fromId) return;
      await handleWorkerReportAction(ctx, Number(ctx.match[1]), fromId, workerSessions, this.requestsService, this.workerAuthService);
    });

    this.registerWorkerEvents(bot, workerSessions);
  }

  private registerWorkerEvents(bot: Telegraf, workerSessions: Map<number, WorkerSession>): void {
    bot.on('contact', async (ctx) => {
      const fromId = ctx.from?.id;
      if (!fromId) return;
      const cleanPhone = ctx.message.contact.phone_number.replace(/\D/g, '');
      const worker = await this.workerRepo
        .createQueryBuilder('w')
        .where("REGEXP_REPLACE(w.phone, '\\D', '', 'g') = :phone", { phone: cleanPhone })
        .andWhere('w.isActive = true')
        .getOne();

      if (worker) {
        await this.workerRepo.update(worker.id, { telegramId: String(fromId) });
        if (worker.adminId) await this.adminRepo.update(worker.adminId, { telegramId: String(fromId) });
        await ctx.reply(`Tabriklaymiz, <b>${worker.fullName}</b>! ✅\n\nTelegram hisobingiz tizimga muvaffaqiyatli biriktirildi.`, {
          parse_mode: 'HTML',
          reply_markup: WORKER_KEYBOARD.reply_markup
        });
        await sendWorkerTasks(ctx, worker.id, this.requestsService);
      } else {
        await ctx.reply(`Kechirasiz, bu raqam tizimda topilmadi. Iltimos, /login buyrug‘i orqali login va parol bilan kiring.`, {
          reply_markup: GUEST_KEYBOARD.reply_markup
        });
      }
    });

    bot.on('photo', async (ctx) => {
      const fromId = ctx.from?.id;
      const session = fromId ? workerSessions.get(fromId) : null;
      if (session?.step === 'await_after_photo' && session.activeRequestId && fromId) {
        await handleWorkerPhotoSubmission(ctx, fromId, session, workerSessions, this.requestsService, this.logger);
      }
    });

    bot.on('text', async (ctx, next) => {
      const fromId = ctx.from?.id;
      if (!fromId) return next();
      const text = ctx.message && 'text' in ctx.message ? String(ctx.message.text || '').trim() : '';
      if (!text || text.startsWith('/')) return next();

      const session = workerSessions.get(fromId);
      if (!session) return next();

      if (session.step === 'awaiting_worker_username') {
        await safeDeleteIncomingTextMessage(ctx);
        session.pendingUsername = text.toLowerCase();
        session.step = 'awaiting_worker_password';
        await ctx.reply(`🔑 <b>Parolni kiriting:</b>`, { parse_mode: 'HTML', reply_markup: CANCEL_KEYBOARD.reply_markup });
        return;
      }

      if (session.step === 'awaiting_worker_password') {
        await safeDeleteIncomingTextMessage(ctx);
        const username = session.pendingUsername;
        if (!username) {
          session.step = 'awaiting_worker_username';
          await ctx.reply(`Foydalanuvchi nomini qaytadan kiriting:`, { reply_markup: CANCEL_KEYBOARD.reply_markup });
          return;
        }

        const res = await this.workerAuthService.authenticateWorker(ctx, username, text, workerSessions);
        if (res.workerId) await sendWorkerTasks(ctx, res.workerId, this.requestsService);
        return;
      }

      return next();
    });
  }

  private async handleMyReports(ctx: any): Promise<void> {
    const fromId = ctx.from?.id;
    if (!fromId) return;
    const { admin, worker } = await this.workerAuthService.findWorkerOrAdminByTelegramId(String(fromId));
    const workerId = worker?.id || admin?.workerId;

    if (!workerId) {
      await ctx.reply(`Iltimos, avval /login buyrug‘i orqali avtorizatsiyadan o‘ting.`, {
        reply_markup: GUEST_KEYBOARD.reply_markup
      });
      return;
    }

    const completed = await this.requestsService.findCompletedByWorker(workerId);
    const active = await this.requestsService.findAssignedToWorker(workerId);
    const name = worker?.fullName || admin?.fullName || 'Xodim';
    const roleName = worker?.role === 'Inspector' ? 'Hudud nazoratchisi' : 'Maxsus texnika haydovchisi';

    await ctx.reply(
      `📊 <b>Xodim shaxsiy hisoboti:</b>\n\n` +
      `👤 <b>Xodim:</b> ${name}\n` +
      `🏷 <b>Lavozim:</b> ${roleName}\n` +
      `🚛 <b>Faol vazifalar soni:</b> ${active.length} ta\n` +
      `✅ <b>Bajarilgan va topshirilgan:</b> ${completed.length} ta\n\n` +
      `Shahrimiz tozaligiga qo‘shayotgan hissangiz uchun tashakkur!`,
      { parse_mode: 'HTML', reply_markup: WORKER_KEYBOARD.reply_markup }
    );
  }
}

import { Logger } from '@nestjs/common';
import { Telegraf, Markup } from 'telegraf';
import { RequestsService } from '../requests/requests.service';
import { DistrictsService } from '../districts/districts.service';
import { MahallasService } from '../mahallas/mahallas.service';
import { TunnelService } from '../tunnel/tunnel.service';
import { RequestSource } from '../../database/entities/request.entity';
import { UserSession } from './bot.types';
import { MAIN_CITIZEN_KEYBOARD, WASTE_TYPE_KEYBOARD } from './bot-keyboards.helper';
import { downloadTelegramFile } from './bot-file.helper';
import {
  getSummaryText,
  sendDistrictSelection,
  sendMahallaSelection,
  sendLocationPrompt
} from './public-bot-dialog.helper';

const logger = new Logger('PublicBotHandlers');

export function registerPublicMediaAndActions(
  bot: Telegraf,
  sessions: Map<number, UserSession>,
  districtsService: DistrictsService,
  mahallasService: MahallasService,
  tunnelService: TunnelService
): void {
  bot.on('photo', async (ctx) => {
    const fromId = ctx.from?.id;
    const session = fromId ? sessions.get(fromId) : null;
    if (session?.step !== 'await_photo') return;

    const photos = ctx.message.photo;
    const highestRes = photos[photos.length - 1];
    try {
      const fileLink = await ctx.telegram.getFileLink(highestRes.file_id);
      session.beforePhotoUrl = await downloadTelegramFile(fileLink.href);
      session.step = 'await_waste_type';
      await ctx.reply(`Rasm qabul qilindi! ✅\n\nChiqindi turini (toifasini) tanlang:`, WASTE_TYPE_KEYBOARD);
    } catch (err) {
      logger.error('Rasm yuklashda xatolik:', err);
      await ctx.reply('Rasmni yuklab bo‘lmadi, iltimos qaytadan yuboring.');
    }
  });

  bot.action(/waste_(.+)/, async (ctx) => {
    const session = ctx.from?.id ? sessions.get(ctx.from.id) : null;
    if (!session) return;
    session.wasteType = ctx.match[1];
    session.step = 'await_location';
    await ctx.answerCbQuery();
    await sendDistrictSelection(ctx, districtsService);
  });

  bot.action(/district_(\d+)/, async (ctx) => {
    const session = ctx.from?.id ? sessions.get(ctx.from.id) : null;
    if (!session) return;
    session.districtId = Number(ctx.match[1]);
    session.mahallaId = undefined;
    session.mahallaName = undefined;

    try {
      const district = await districtsService.findOne(session.districtId);
      if (district) session.districtName = district.name;
    } catch {}

    await ctx.answerCbQuery(`Tuman: ${session.districtName || 'Tanlandi'}`);
    await sendMahallaSelection(ctx, session, mahallasService);
  });

  bot.action('change_district', async (ctx) => {
    const session = ctx.from?.id ? sessions.get(ctx.from.id) : null;
    if (!session) return;
    await ctx.answerCbQuery();
    await sendDistrictSelection(ctx, districtsService, session.districtId);
  });

  bot.action('change_mahalla', async (ctx) => {
    const session = ctx.from?.id ? sessions.get(ctx.from.id) : null;
    if (!session) return;
    await ctx.answerCbQuery();
    if (session.districtId) {
      await sendMahallaSelection(ctx, session, mahallasService);
    } else {
      await sendDistrictSelection(ctx, districtsService);
    }
  });

  bot.action('custom_mahalla', async (ctx) => {
    const session = ctx.from?.id ? sessions.get(ctx.from.id) : null;
    if (!session) return;
    session.step = 'await_custom_mahalla';
    await ctx.answerCbQuery();
    await ctx.reply(
      `🏛 **Tuman:** ${session.districtName || 'Tanlangan'}\n\n` +
      `✍️ **Mahallangiz nomini yozib yuboring:**\n` +
      `Masalan: _Istiqlol MFY_ yoki _Yangi Hayot mahallasi_`,
      {
        parse_mode: 'Markdown',
        ...Markup.keyboard([['🔄 Boshqa tumanni tanlash'], ['❌ Bekor qilish']]).resize()
      }
    );
  });

  bot.action('keep_location', async (ctx) => {
    const session = ctx.from?.id ? sessions.get(ctx.from.id) : null;
    if (!session) return;
    await ctx.answerCbQuery('O‘zgarishsiz qoldirildi');
    if (session.step === 'await_confirm') {
      await ctx.reply(getSummaryText(session), {
        parse_mode: 'Markdown',
        ...Markup.keyboard([['✅ Ha, murojaatni yuborish'], ['🔄 Tuman/Mahallani o‘zgartirish', '❌ Bekor qilish']]).resize()
      });
    } else {
      await sendLocationPrompt(ctx, session, tunnelService);
    }
  });

  bot.action(/mahalla_(\d+)/, async (ctx) => {
    const session = ctx.from?.id ? sessions.get(ctx.from.id) : null;
    if (!session) return;

    const mahallaId = Number(ctx.match[1]);
    try {
      const mahalla = await mahallasService.findOne(mahallaId);
      if (mahalla) {
        session.mahallaId = mahalla.id;
        session.mahallaName = mahalla.name;
        if (mahalla.centerLat && mahalla.centerLng) {
          session.lat = Number(mahalla.centerLat);
          session.lng = Number(mahalla.centerLng);
        }
      }
    } catch {}

    session.lat = session.lat || 41.0108;
    session.lng = session.lng || 71.5775;
    session.step = 'await_landmark';
    await ctx.answerCbQuery(`Mahalla: ${session.mahallaName || 'Tanlandi'}`);
    await sendLocationPrompt(ctx, session, tunnelService);
  });
}

export async function submitCitizenRequest(
  ctx: any,
  fromId: number,
  session: UserSession,
  sessions: Map<number, UserSession>,
  requestsService: RequestsService
): Promise<void> {
  try {
    const req = await requestsService.create({
      districtId: session.districtId || 1,
      mahallaId: session.mahallaId,
      mahallaName: session.mahallaName,
      source: RequestSource.TELEGRAM,
      citizenTelegramId: String(fromId),
      citizenFullName: ctx.from?.first_name || 'Fuqaro',
      beforePhotoUrl: session.beforePhotoUrl || '',
      wasteType: session.wasteType || 'maishiy',
      lat: session.lat,
      lng: session.lng,
      address: session.address,
      description: session.description
    });

    sessions.delete(fromId);
    await ctx.reply(
      `🎉 Rahmat! Sizning #${req.id} raqamli murojaatingiz muvaffaqiyatli qabul qilindi.\n\n` +
      `Tez orada tuman sanitar tozalash xizmati xodimlari hududga chiqib tozalashadi. Natija haqida sizga rasm bilan xabar beramiz!`,
      MAIN_CITIZEN_KEYBOARD
    );
  } catch (err) {
    logger.error('Murojaat yaratishda xatolik:', err);
    await ctx.reply('Murojaatni saqlashda xatolik yuz berdi. Iltimos qaytadan urinib ko‘ring.');
  }
}

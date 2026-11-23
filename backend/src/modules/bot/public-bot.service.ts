import { Injectable, Logger } from '@nestjs/common';
import { Telegraf, Markup } from 'telegraf';
import { RequestsService } from '../requests/requests.service';
import { DistrictsService } from '../districts/districts.service';
import { MahallasService } from '../mahallas/mahallas.service';
import { TunnelService } from '../tunnel/tunnel.service';
import { RequestStatus } from '../../database/entities/request.entity';
import { UserSession } from './bot.types';
import { MAIN_CITIZEN_KEYBOARD } from './bot-keyboards.helper';
import { getSummaryText, sendLocationPrompt } from './public-bot-dialog.helper';
import { registerPublicMediaAndActions, submitCitizenRequest } from './public-bot-handlers';

@Injectable()
export class PublicBotService {
  private readonly logger = new Logger(PublicBotService.name);

  constructor(
    private readonly requestsService: RequestsService,
    private readonly districtsService: DistrictsService,
    private readonly mahallasService: MahallasService,
    private readonly tunnelService: TunnelService
  ) {}

  registerHandlers(bot: Telegraf, sessions: Map<number, UserSession>): void {
    bot.start(async (ctx) => {
      const fromId = ctx.from?.id;
      if (!fromId) return;
      sessions.set(fromId, { step: 'idle' });
      await ctx.reply(
        `🌿 Assalomu alaykum! "Toza Hudud" axborot tizimining rasmiy botiga xush kelibsiz.\n\n` +
        `Ushbu bot orqali to‘planib qolgan chiqindilar va noqonuniy chiqindixonalar haqida tezkor xabar berishingiz mumkin.`,
        MAIN_CITIZEN_KEYBOARD
      );
    });

    bot.command(['login', 'signin'], async (ctx) => this.sendWorkerBotLink(ctx));
    bot.hears(/^(🔑 Xodim sifatida kirish|Xodim sifatida kirish|Kirish)$/i, async (ctx) => this.sendWorkerBotLink(ctx));

    bot.hears('📸 Chiqindi haqida xabar berish', async (ctx) => {
      const fromId = ctx.from?.id;
      if (!fromId) return;
      sessions.set(fromId, { step: 'await_photo' });
      await ctx.reply(`Iltimos, to‘planib qolgan chiqindi joyining rasmini (fotosuratini) yuboring:`, Markup.keyboard([['❌ Bekor qilish']]).resize());
    });

    bot.hears('📋 Mening murojaatlarim', async (ctx) => this.handleMyRequests(ctx));

    bot.hears('📞 Aloqa', async (ctx) => {
      await ctx.reply(
        `📞 **"Toza Hudud" axborot xizmati:**\n\n` +
        `ℹ️ Hozircha dispetcherlik xizmati mavjud emas.\n\n` +
        `Chiqindilarni tozalash bo‘yicha murojaat yuborish uchun pastdagi **"📸 Chiqindi haqida xabar berish"** tugmasidan foydalanishingiz mumkin.`
      );
    });

    bot.hears('❌ Bekor qilish', async (ctx) => {
      const fromId = ctx.from?.id;
      if (fromId) sessions.delete(fromId);
      await ctx.reply(`Amal bekor qilindi. Bosh menyudasiz:`, MAIN_CITIZEN_KEYBOARD);
    });

    registerPublicMediaAndActions(bot, sessions, this.districtsService, this.mahallasService, this.tunnelService);
    this.registerLocationAndText(bot, sessions);
  }

  private registerLocationAndText(bot: Telegraf, sessions: Map<number, UserSession>): void {
    bot.on('message', async (ctx, next) => {
      const msg = ctx.message as any;
      if (msg?.web_app_data?.data && ctx.from?.id) {
        try {
          const data = JSON.parse(msg.web_app_data.data);
          const session = sessions.get(ctx.from.id);
          if (session) {
            session.lat = Number(data.lat);
            session.lng = Number(data.lng);
            if (data.address) {
              session.address = data.address;
              session.description = data.address;
            }
            session.step = 'await_confirm';
            await ctx.reply(getSummaryText(session), {
              parse_mode: 'Markdown',
              ...Markup.keyboard([['✅ Ha, murojaatni yuborish'], ['🔄 Tuman/Mahallani o‘zgartirish', '❌ Bekor qilish']]).resize()
            });
            return;
          }
        } catch (err) {
          this.logger.error('Web App data error:', err);
        }
      }
      return next();
    });

    bot.on('location', async (ctx) => {
      const session = ctx.from?.id ? sessions.get(ctx.from.id) : null;
      if (session) {
        session.lat = ctx.message.location.latitude;
        session.lng = ctx.message.location.longitude;
        session.step = 'await_confirm';
        await ctx.reply(`📍 **Lokatsiya qabul qilindi!** ✅\n\n` + getSummaryText(session), {
          parse_mode: 'Markdown',
          ...Markup.keyboard([['✅ Ha, murojaatni yuborish'], ['🔄 Tuman/Mahallani o‘zgartirish', '❌ Bekor qilish']]).resize()
        });
      }
    });

    bot.on('text', async (ctx) => {
      const fromId = ctx.from?.id;
      const session = fromId ? sessions.get(fromId) : null;
      if (!session || !fromId) return;

      const text = ctx.message.text.trim();
      if (/^🔄 (Tuman yoki mahallani|Tuman\/Mahallani|Tumanni|Boshqa tumanni)/i.test(text)) {
        await ctx.reply(`📍 **Hududni o‘zgartirish**\n\nQaysi ma’lumotni qayta tanlamoqchisiz?`, Markup.inlineKeyboard([
          [Markup.button.callback('🏛 Tumanni qayta tanlash', 'change_district')],
          [Markup.button.callback('🏘 Mahallani qayta tanlash', 'change_mahalla')],
          [Markup.button.callback('◀️ Bekor qilish (O‘zgartirmaslik)', 'keep_location')]
        ]));
        return;
      }

      if (session.step === 'await_custom_mahalla') {
        session.mahallaName = text;
        session.mahallaId = undefined;
        session.step = 'await_landmark';
        await ctx.reply(`🏘 Mahalla: **${text}** qabul qilindi. ✅`, { parse_mode: 'Markdown' });
        await sendLocationPrompt(ctx, session, this.tunnelService);
        return;
      }

      if (session.step === 'await_landmark') {
        if (text !== '➡️ Mo‘ljalsiz davom etish') {
          session.address = text;
          session.description = text;
        }
        session.step = 'await_confirm';
        await ctx.reply(getSummaryText(session), {
          parse_mode: 'Markdown',
          ...Markup.keyboard([['✅ Ha, murojaatni yuborish'], ['🔄 Tuman/Mahallani o‘zgartirish', '❌ Bekor qilish']]).resize()
        });
      } else if (session.step === 'await_confirm' && text === '✅ Ha, murojaatni yuborish') {
        await submitCitizenRequest(ctx, fromId, session, sessions, this.requestsService);
      }
    });
  }

  private async handleMyRequests(ctx: any): Promise<void> {
    const fromId = ctx.from?.id;
    if (!fromId) return;

    const requests = await this.requestsService.findAll({ page: 1, limit: 10 }, null);
    const userRequests = requests.items.filter((r) => r.citizenTelegramId === String(fromId));

    if (userRequests.length === 0) {
      await ctx.reply(
        `Sizda hozircha yuborilgan murojaatlar mavjud emas. Chiqindi haqida xabar berish uchun quyidagi tugmani bosing:`,
        MAIN_CITIZEN_KEYBOARD
      );
      return;
    }

    let msg = `📋 **Sizning oxirgi murojaatlaringiz:**\n\n`;
    userRequests.slice(0, 5).forEach((r) => {
      const statusText =
        r.status === RequestStatus.COMPLETED
          ? '✅ Tozalandi'
          : r.status === RequestStatus.SUBMITTED
          ? '🔍 Tasdiqda'
          : r.status === RequestStatus.IN_PROGRESS
          ? '⏳ Jarayonda'
          : '🆕 Yangi';

      msg += `• **#${r.id}** — ${r.mahallaName || 'Mahalla'}\n`;
      msg += `  Holat: ${statusText}\n`;
      msg += `  Sana: ${new Date(r.createdAt).toLocaleDateString()}\n\n`;
    });

    await ctx.reply(msg);
  }

  private async sendWorkerBotLink(ctx: any): Promise<void> {
    await ctx.reply(
      `🚛 <b>Hurmatli xodim!</b>\n\n` +
      `Xodimlar uchun maxsus @toza_hudud_worker_bot mavjud.\n` +
      `Vazifalarni ko‘rish, qabul qilish va tozalangan joy rasmini topshirish uchun quyidagi havola orqali xodimlar botiga o‘ting va shaxsiy <b>Login</b> hamda <b>Parol</b>ingiz bilan kiring:`,
      {
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [[Markup.button.url('🚛 Xodim Botiga o‘tish', 'https://t.me/toza_hudud_worker_bot')]]
        }
      }
    );
  }
}

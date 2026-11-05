import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Telegraf, Markup } from 'telegraf';
import axios from 'axios';
import * as bcrypt from 'bcryptjs';
import { createWriteStream, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { RequestsService } from '../requests/requests.service';
import { DistrictsService } from '../districts/districts.service';
import { MahallasService } from '../mahallas/mahallas.service';
import { WorkersService } from '../workers/workers.service';
import { RealtimeService } from '../../common/realtime/realtime.service';
import { RequestSource, RequestStatus } from '../../database/entities/request.entity';
import { AdminEntity, AdminRole } from '../../database/entities/admin.entity';
import { WorkerEntity } from '../../database/entities/worker.entity';

interface UserSession {
  step: 'idle' | 'await_photo' | 'await_waste_type' | 'await_location' | 'await_mahalla' | 'await_custom_mahalla' | 'await_landmark' | 'await_confirm' | 'await_worker_after_photo';
  districtId?: number;
  districtName?: string;
  mahallaId?: number;
  mahallaName?: string;
  wasteType?: string;
  beforePhotoUrl?: string;
  lat?: number;
  lng?: number;
  address?: string;
  description?: string;
  activeRequestId?: number;
}

interface WorkerSession {
  step: 'idle' | 'awaiting_worker_username' | 'awaiting_worker_password' | 'await_after_photo';
  pendingUsername?: string;
  activeRequestId?: number;
}

const UPLOAD_DIR = './uploads';

const WORKER_KEYBOARD = Markup.keyboard([
  ['🚛 Biriktirilgan vazifalarim'],
  ['📊 Mening hisobotlarim', '🚪 Tizimdan chiqish']
]).resize();

const GUEST_KEYBOARD = Markup.keyboard([
  ['🔑 Xodim sifatida kirish']
]).resize();

const CANCEL_KEYBOARD = Markup.keyboard([
  ['❌ Bekor qilish']
]).resize();

@Injectable()
export class BotService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(BotService.name);
  private bot: Telegraf | null = null;
  private workerBot: Telegraf | null = null;
  private readonly sessions = new Map<number, UserSession>();
  private readonly workerSessions = new Map<number, WorkerSession>();

  constructor(
    private readonly configService: ConfigService,
    private readonly requestsService: RequestsService,
    private readonly districtsService: DistrictsService,
    private readonly mahallasService: MahallasService,
    private readonly workersService: WorkersService,
    private readonly realtimeService: RealtimeService,
    @InjectRepository(AdminEntity)
    private readonly adminRepo: Repository<AdminEntity>,
    @InjectRepository(WorkerEntity)
    private readonly workerRepo: Repository<WorkerEntity>
  ) {}

  async onModuleInit(): Promise<void> {
    // Listen to real-time events from RequestsService
    this.setupRealtimeListeners();

    const citizenToken = this.configService.get<string>('TELEGRAM_BOT_TOKEN');
    const workerToken = this.configService.get<string>('TELEGRAM_WORKER_BOT_TOKEN');

    // 1. Initialize Citizen / Public Bot
    if (citizenToken) {
      try {
        this.bot = new Telegraf(citizenToken);
        this.bot.catch((err: any) => {
          this.logger.error(`Fuqaro boti ichki xatoligi:`, err?.message || err);
        });
        this.registerCitizenHandlers(this.bot);

        const me = await this.bot.telegram.getMe();
        this.logger.log(`🌿 Fuqaro Telegram Boti @${me.username || 'unknown'} muvaffaqiyatli ulandi!`);

        this.launchWithAutoRetry(this.bot, 'Fuqaro');
      } catch (err) {
        this.logger.error('Fuqaro Telegram botini ishga tushirishda xatolik:', err);
      }
    } else {
      this.logger.warn('TELEGRAM_BOT_TOKEN kiritilmagan.');
    }

    // 2. Initialize Worker Bot
    if (workerToken) {
      try {
        this.workerBot = new Telegraf(workerToken);
        this.workerBot.catch((err: any) => {
          this.logger.error(`Xodim boti ichki xatoligi:`, err?.message || err);
        });
        this.registerWorkerHandlers(this.workerBot);

        const meWorker = await this.workerBot.telegram.getMe();
        this.logger.log(`🚛 Xodim Telegram Boti @${meWorker.username || 'unknown'} muvaffaqiyatli ulandi!`);

        this.launchWithAutoRetry(this.workerBot, 'Xodim');
      } catch (err) {
        this.logger.error('Xodim Telegram botini ishga tushirishda xatolik:', err);
      }
    } else {
      this.logger.warn('TELEGRAM_WORKER_BOT_TOKEN kiritilmagan.');
    }
  }

  private setupRealtimeListeners(): void {
    // 1. When a task is assigned to a worker
    this.realtimeService.onRequestAssigned(async ({ request, worker, isReassignment }) => {
      // Notify Worker via workerBot
      if (this.workerBot && worker.telegramId) {
        try {
          const roleLabel = worker.role === 'Inspector' ? '🔍 Hudud nazoratchisi / Usta' : '🚛 Maxsus texnika haydovchisi';
          const address = [request.mahallaName, request.address].filter(Boolean).join(', ') || 'Manzil ko‘rsatilmagan';

          const title = isReassignment ? '🚨 <b>QAYTA BIRIKTIRILGAN TOPSHIRIQ!</b>' : '🚨 <b>YANGI TOPSHIRIQ BIRIKTIRILDI!</b>';
          const text =
            `${title}\n\n` +
            `📋 <b>Murojaat raqami:</b> #${request.id}\n` +
            `🏷 <b>Vazifa toifasi:</b> ${roleLabel}\n` +
            `📍 <b>Manzil:</b> ${address}\n` +
            `🗑 <b>Chiqindi turi:</b> ${request.wasteType || 'maishiy'}\n` +
            `👤 <b>Murojaatchi:</b> ${request.citizenFullName || 'Fuqaro'} (${request.citizenPhone || '-'})\n\n` +
            `Joyiga yetib borgach, tozalash ishlarini bajaring va hisobot fotosuratini yuborish uchun pastdagi tugmani bosing:`;

          const buttons: any[] = [
            [Markup.button.callback('📸 Hisobot yuklash (Bajarildi)', `done_${request.id}`)]
          ];

          if (request.lat && request.lng) {
            buttons[0].push(Markup.button.url('📍 Xaritada ko‘rish', `https://maps.google.com/?q=${request.lat},${request.lng}`));
          }

          await this.workerBot.telegram.sendMessage(worker.telegramId, text, {
            parse_mode: 'HTML',
            reply_markup: { inline_keyboard: buttons }
          });
        } catch (err: any) {
          this.logger.warn(`Worker Telegram bildirishnomasi yuborilmadi: ${err.message}`);
        }
      }

      // Notify Citizen via public bot
      if (this.bot && request.citizenTelegramId) {
        try {
          const roleLabel = worker.role === 'Inspector' ? 'Hudud nazoratchisi' : 'Haydovchi';
          const vehicleInfo = worker.vehicleNumber ? ` [${worker.vehicleNumber}]` : '';

          let text = '';
          if (isReassignment) {
            text =
              `🔄 <b>Murojaatingiz bo‘yicha mas’ul ijrochi yangilandi!</b>\n\n` +
              `📋 <b>Murojaat raqami:</b> #${request.id}\n` +
              `👤 <b>Yangi mas’ul ijrochi:</b> ${worker.fullName} (${roleLabel}${vehicleInfo})\n` +
              `📞 <b>Aloqa telefoni:</b> ${worker.phone}\n` +
              `⏱ <b>Holati:</b> Jarayonda\n\n` +
              `ℹ️ Chiqindini tozalash uchun yangi mas'ul xodim va maxsus texnika yo‘naltirildi. Xodim tez orada manzilingizga yetib boradi.`;
          } else {
            text =
              `🚚 <b>Murojaatingizga mas’ul xodim biriktirildi!</b>\n\n` +
              `📋 <b>Murojaat raqami:</b> #${request.id}\n` +
              `👤 <b>Mas’ul ijrochi:</b> ${worker.fullName} (${roleLabel}${vehicleInfo})\n` +
              `📞 <b>Aloqa telefoni:</b> ${worker.phone}\n` +
              `⏱ <b>Holati:</b> Jarayonda\n\n` +
              `Xodim tez orada manzilingizga yetib boradi va masalani hal qiladi.`;
          }

          await this.bot.telegram.sendMessage(request.citizenTelegramId, text, {
            parse_mode: 'HTML'
          });
        } catch (err: any) {
          this.logger.warn(`Fuqaro Telegram bildirishnomasi yuborilmadi: ${err.message}`);
        }
      }
    });

    // 2. When a task is verified & completed
    this.realtimeService.onRequestCompleted(async ({ request }) => {
      if (this.bot && request.citizenTelegramId) {
        try {
          const text =
            `🎉 <b>Murojaatingiz muvaffaqiyatli yakunlandi!</b>\n\n` +
            `📋 <b>Murojaat:</b> #${request.id}\n` +
            `✅ Hududni tozalash ishlari to‘liq bajarildi va nazoratdan o‘tdi.\n\n` +
            `Toza Hudud xizmatidan foydalanganingiz uchun tashakkur!`;

          await this.bot.telegram.sendMessage(request.citizenTelegramId, text, {
            parse_mode: 'HTML'
          });
        } catch (err: any) {
          this.logger.warn(`Fuqaro yakunlash bildirishnomasi yuborilmadi: ${err.message}`);
        }
      }
    });
  }

  private launchWithAutoRetry(bot: Telegraf, name: string): void {
    let retrying = false;
    const run = () => {
      bot.launch({ dropPendingUpdates: true }).catch((err: any) => {
        this.logger.error(`${name} Telegram bot polling xatoligi:`, err?.message || err);
        if (!retrying) {
          retrying = true;
          setTimeout(() => {
            try {
              bot.stop();
            } catch {
              // ignore
            }
            this.logger.log(`${name} Telegram boti qayta ulanmoqda...`);
            retrying = false;
            run();
          }, 5000);
        }
      });
    };
    run();
  }

  onModuleDestroy(): void {
    if (this.bot) {
      this.bot.stop('Shutdown');
    }
    if (this.workerBot) {
      this.workerBot.stop('Shutdown');
    }
  }

  private registerCitizenHandlers(bot: Telegraf): void {
    bot.start(async (ctx) => {
      const fromId = ctx.from?.id;
      if (!fromId) return;

      this.sessions.set(fromId, { step: 'idle' });

      await ctx.reply(
        `🌿 Assalomu alaykum! "Toza Hudud" axborot tizimining rasmiy botiga xush kelibsiz.\n\n` +
        `Ushbu bot orqali to‘planib qolgan chiqindilar va noqonuniy chiqindixonalar haqida tezkor xabar berishingiz mumkin.`,
        Markup.keyboard([
          ['📸 Chiqindi haqida xabar berish'],
          ['📋 Mening murojaatlarim', '📞 Aloqa']
        ]).resize()
      );
    });

    bot.command(['login', 'signin'], async (ctx) => {
      await ctx.reply(
        `🚛 <b>Hurmatli xodim!</b>\n\n` +
        `Xodimlar uchun maxsus @toza_hudud_worker_bot mavjud.\n` +
        `Vazifalarni ko‘rish, qabul qilish va tozalangan joy rasmini topshirish uchun quyidagi havola orqali xodimlar botiga o‘ting va shaxsiy <b>Login</b> hamda <b>Parol</b>ingiz bilan kiring:`,
        {
          parse_mode: 'HTML',
          reply_markup: {
            inline_keyboard: [
              [Markup.button.url('🚛 Xodim Botiga o‘tish', 'https://t.me/toza_hudud_worker_bot')]
            ]
          }
        }
      );
    });

    bot.hears(/^(🔑 Xodim sifatida kirish|Xodim sifatida kirish|Kirish)$/i, async (ctx) => {
      await ctx.reply(
        `🚛 <b>Hurmatli xodim!</b>\n\n` +
        `Xodimlar uchun maxsus @toza_hudud_worker_bot mavjud.\n` +
        `Vazifalarni ko‘rish, qabul qilish va tozalangan joy rasmini topshirish uchun quyidagi havola orqali xodimlar botiga o‘ting va shaxsiy <b>Login</b> hamda <b>Parol</b>ingiz bilan kiring:`,
        {
          parse_mode: 'HTML',
          reply_markup: {
            inline_keyboard: [
              [Markup.button.url('🚛 Xodim Botiga o‘tish', 'https://t.me/toza_hudud_worker_bot')]
            ]
          }
        }
      );
    });

    bot.hears('📸 Chiqindi haqida xabar berish', async (ctx) => {
      const fromId = ctx.from?.id;
      if (!fromId) return;

      this.sessions.set(fromId, { step: 'await_photo' });

      await ctx.reply(
        `Iltimos, to‘planib qolgan chiqindi joyining rasmini (fotosuratini) yuboring:`,
        Markup.keyboard([['❌ Bekor qilish']]).resize()
      );
    });

    bot.hears('📋 Mening murojaatlarim', async (ctx) => {
      const fromId = ctx.from?.id;
      if (!fromId) return;

      const requests = await this.requestsService.findAll(
        { page: 1, limit: 10 },
        null
      );
      const userRequests = requests.items.filter(
        (r: any) => r.citizenTelegramId === String(fromId)
      );

      if (userRequests.length === 0) {
        await ctx.reply(
          `Sizda hozircha yuborilgan murojaatlar mavjud emas. Chiqindi haqida xabar berish uchun quyidagi tugmani bosing:`,
          Markup.keyboard([
            ['📸 Chiqindi haqida xabar berish'],
            ['📋 Mening murojaatlarim', '📞 Aloqa']
          ]).resize()
        );
        return;
      }

      let msg = `📋 **Sizning oxirgi murojaatlaringiz:**\n\n`;
      userRequests.slice(0, 5).forEach((r: any) => {
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
    });

    bot.hears('📞 Aloqa', async (ctx) => {
      await ctx.reply(
        `📞 **"Toza Hudud" axborot xizmati:**\n\n` +
        `• Call-markaz: +998 (71) 200-00-00\n` +
        `• Ish vaqti: Har kuni 08:00 dan 20:00 gacha\n` +
        `• Manzil: Hududiy sanitar-tozalash boshqarmasi`
      );
    });

    bot.hears('❌ Bekor qilish', async (ctx) => {
      const fromId = ctx.from?.id;
      if (fromId) this.sessions.delete(fromId);
      await ctx.reply(
        `Amal bekor qilindi. Bosh menyudasiz:`,
        Markup.keyboard([
          ['📸 Chiqindi haqida xabar berish'],
          ['📋 Mening murojaatlarim', '📞 Aloqa']
        ]).resize()
      );
    });

    // Handle incoming photos
    bot.on('photo', async (ctx) => {
      const fromId = ctx.from?.id;
      if (!fromId) return;

      const session = this.sessions.get(fromId);
      if (session?.step === 'await_photo') {
        const photos = ctx.message.photo;
        const highestRes = photos[photos.length - 1];

        try {
          const fileLink = await ctx.telegram.getFileLink(highestRes.file_id);
          const savedPath = await this.downloadTelegramFile(fileLink.href);

          session.beforePhotoUrl = savedPath;
          session.step = 'await_waste_type';

          await ctx.reply(
            `Rasm qabul qilindi! ✅\n\nChiqindi turini (toifasini) tanlang:`,
            Markup.inlineKeyboard([
              [
                Markup.button.callback('🗑 Maishiy chiqindi', 'waste_maishiy'),
                Markup.button.callback('🧱 Qurilish chiqindisi', 'waste_qurilish')
              ],
              [
                Markup.button.callback('🍂 Xazon va shoxlar', 'waste_xazon'),
                Markup.button.callback('🛋 Katta hajmli chiqindi', 'waste_katta_hajmli')
              ],
              [
                Markup.button.callback('⚠️ Noqonuniy tashlandiq', 'waste_noqonuniy')
              ]
            ])
          );
        } catch (err) {
          this.logger.error('Rasm yuklashda xatolik:', err);
          await ctx.reply('Rasmni yuklab bo‘lmadi, iltimos qaytadan yuboring.');
        }
      }
    });

    // Waste type selection callback
    bot.action(/waste_(.+)/, async (ctx) => {
      const fromId = ctx.from?.id;
      if (!fromId) return;

      const session = this.sessions.get(fromId);
      if (!session) return;

      session.wasteType = ctx.match[1];
      session.step = 'await_location';
      await ctx.answerCbQuery();

      await this.sendDistrictSelection(ctx);
    });

    // District selection callback
    bot.action(/district_(\d+)/, async (ctx) => {
      const fromId = ctx.from?.id;
      if (!fromId) return;

      const session = this.sessions.get(fromId);
      if (!session) return;

      const districtId = Number(ctx.match[1]);
      session.districtId = districtId;
      session.mahallaId = undefined;
      session.mahallaName = undefined;

      try {
        const district = await this.districtsService.findOne(districtId);
        if (district) {
          session.districtName = district.name;
        }
      } catch {
        // ignore
      }

      await ctx.answerCbQuery(`Tuman: ${session.districtName || 'Tanlandi'}`);
      await this.sendMahallaSelection(ctx, session);
    });

    // Change district callback
    bot.action('change_district', async (ctx) => {
      const fromId = ctx.from?.id;
      if (!fromId) return;
      const session = this.sessions.get(fromId);
      if (!session) return;

      await ctx.answerCbQuery();
      await this.sendDistrictSelection(ctx, session.districtId);
    });

    // Change mahalla callback
    bot.action('change_mahalla', async (ctx) => {
      const fromId = ctx.from?.id;
      if (!fromId) return;
      const session = this.sessions.get(fromId);
      if (!session) return;

      await ctx.answerCbQuery();
      if (session.districtId) {
        await this.sendMahallaSelection(ctx, session);
      } else {
        await this.sendDistrictSelection(ctx);
      }
    });

    // Custom mahalla manual input callback
    bot.action('custom_mahalla', async (ctx) => {
      const fromId = ctx.from?.id;
      if (!fromId) return;
      const session = this.sessions.get(fromId);
      if (!session) return;

      session.step = 'await_custom_mahalla';
      await ctx.answerCbQuery();

      await ctx.reply(
        `🏛 **Tuman:** ${session.districtName || 'Tanlangan'}\n\n` +
        `✍️ **Mahallangiz nomini yozib yuboring:**\n` +
        `Masalan: _Istiqlol MFY_ yoki _Yangi Hayot mahallasi_`,
        {
          parse_mode: 'Markdown',
          ...Markup.keyboard([
            ['🔄 Boshqa tumanni tanlash'],
            ['❌ Bekor qilish']
          ]).resize()
        }
      );
    });

    // Cancel edit and keep location
    bot.action('keep_location', async (ctx) => {
      const fromId = ctx.from?.id;
      if (!fromId) return;
      const session = this.sessions.get(fromId);
      if (!session) return;

      await ctx.answerCbQuery('O‘zgarishsiz qoldirildi');
      if (session.step === 'await_confirm') {
        await ctx.reply(
          this.getSummaryText(session),
          {
            parse_mode: 'Markdown',
            ...Markup.keyboard([
              ['✅ Ha, murojaatni yuborish'],
              ['🔄 Tuman/Mahallani o‘zgartirish', '❌ Bekor qilish']
            ]).resize()
          }
        );
      } else {
        await this.sendLocationPrompt(ctx, session);
      }
    });

    // Mahalla selection callback
    bot.action(/mahalla_(\d+)/, async (ctx) => {
      const fromId = ctx.from?.id;
      if (!fromId) return;

      const session = this.sessions.get(fromId);
      if (!session) return;

      const mahallaId = Number(ctx.match[1]);
      try {
        const mahalla = await this.mahallasService.findOne(mahallaId);
        if (mahalla) {
          session.mahallaId = mahalla.id;
          session.mahallaName = mahalla.name;
          if (mahalla.centerLat && mahalla.centerLng) {
            session.lat = Number(mahalla.centerLat);
            session.lng = Number(mahalla.centerLng);
          }
        }
      } catch {
        // ignore
      }

      if (!session.districtName && session.districtId) {
        try {
          const district = await this.districtsService.findOne(session.districtId);
          if (district) {
            session.districtName = district.name;
            if (!session.lat || !session.lng) {
              session.lat = Number(district.centerLat);
              session.lng = Number(district.centerLng);
            }
          }
        } catch {
          // ignore
        }
      }

      session.lat = session.lat || 41.0108;
      session.lng = session.lng || 71.5775;
      session.step = 'await_landmark';

      await ctx.answerCbQuery(`Mahalla: ${session.mahallaName || 'Tanlandi'}`);
      await this.sendLocationPrompt(ctx, session);
    });

    // Telegram WebApp location picker receiver
    bot.on('message', async (ctx, next) => {
      const msg = ctx.message as any;
      if (msg && msg.web_app_data && msg.web_app_data.data) {
        const fromId = ctx.from?.id;
        if (!fromId) return;

        try {
          const data = JSON.parse(msg.web_app_data.data);
          const session = this.sessions.get(fromId);
          if (session) {
            session.lat = Number(data.lat);
            session.lng = Number(data.lng);
            if (data.address) {
              session.address = data.address;
              session.description = data.address;
            }
            session.step = 'await_confirm';

            await ctx.reply(
              this.getSummaryText(session),
              {
                parse_mode: 'Markdown',
                ...Markup.keyboard([
                  ['✅ Ha, murojaatni yuborish'],
                  ['🔄 Tuman/Mahallani o‘zgartirish', '❌ Bekor qilish']
                ]).resize()
              }
            );
            return;
          }
        } catch (err) {
          this.logger.error('Web App data error:', err);
        }
      }
      return next();
    });

    // Location message handler (GPS or Telegram native map pin)
    bot.on('location', async (ctx) => {
      const fromId = ctx.from?.id;
      if (!fromId) return;

      const session = this.sessions.get(fromId);
      if (session) {
        const { latitude, longitude } = ctx.message.location;
        session.lat = latitude;
        session.lng = longitude;
        session.step = 'await_confirm';

        await ctx.reply(
          `📍 **Lokatsiya qabul qilindi!** ✅\n\n` + this.getSummaryText(session),
          {
            parse_mode: 'Markdown',
            ...Markup.keyboard([
              ['✅ Ha, murojaatni yuborish'],
              ['🔄 Tuman/Mahallani o‘zgartirish', '❌ Bekor qilish']
            ]).resize()
          }
        );
      }
    });

    // Text messages for landmark/description, location changes, and confirmation
    bot.on('text', async (ctx) => {
      const fromId = ctx.from?.id;
      if (!fromId) return;

      const text = ctx.message.text.trim();
      const session = this.sessions.get(fromId);

      // Handle Change District/Mahalla requests from reply keyboard
      if (
        session &&
        (text === '🔄 Tuman yoki mahallani o‘zgartirish' ||
          text === '🔄 Tuman/Mahallani o‘zgartirish' ||
          text === '🔄 Tumanni o‘zgartirish' ||
          text === '🔄 Boshqa tumanni tanlash')
      ) {
        await ctx.reply(
          `📍 **Hududni o‘zgartirish**\n\nQaysi ma’lumotni qayta tanlamoqchisiz?`,
          Markup.inlineKeyboard([
            [Markup.button.callback('🏛 Tumanni qayta tanlash', 'change_district')],
            [Markup.button.callback('🏘 Mahallani qayta tanlash', 'change_mahalla')],
            [Markup.button.callback('◀️ Bekor qilish (O‘zgartirmaslik)', 'keep_location')]
          ])
        );
        return;
      }

      if (session?.step === 'await_custom_mahalla') {
        session.mahallaName = text;
        session.mahallaId = undefined;
        session.step = 'await_landmark';
        await ctx.reply(`🏘 Mahalla: **${text}** qabul qilindi. ✅`, { parse_mode: 'Markdown' });
        await this.sendLocationPrompt(ctx, session);
        return;
      }

      if (session?.step === 'await_landmark') {
        if (text !== '➡️ Mo‘ljalsiz davom etish') {
          session.address = text;
          session.description = text;
        }

        session.step = 'await_confirm';

        await ctx.reply(
          this.getSummaryText(session),
          {
            parse_mode: 'Markdown',
            ...Markup.keyboard([
              ['✅ Ha, murojaatni yuborish'],
              ['🔄 Tuman/Mahallani o‘zgartirish', '❌ Bekor qilish']
            ]).resize()
          }
        );
      } else if (session?.step === 'await_confirm') {
        if (text === '✅ Ha, murojaatni yuborish') {
          try {
            const req = await this.requestsService.create({
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

            this.sessions.delete(fromId);

            await ctx.reply(
              `🎉 Rahmat! Sizning #${req.id} raqamli murojaatingiz muvaffaqiyatli qabul qilindi.\n\n` +
              `Tez orada tuman sanitar tozalash xizmati xodimlari hududga chiqib tozalashadi. Natija haqida sizga rasm bilan xabar beramiz!`,
              Markup.keyboard([
                ['📸 Chiqindi haqida xabar berish'],
                ['📋 Mening murojaatlarim', '📞 Aloqa']
              ]).resize()
            );
          } catch (err) {
            this.logger.error('Murojaat yaratishda xatolik:', err);
            await ctx.reply('Murojaatni saqlashda xatolik yuz berdi. Iltimos qaytadan urinib ko‘ring.');
          }
        }
      }
    });
  }

  private getSummaryText(session: UserSession): string {
    const wasteLabels: Record<string, string> = {
      maishiy: '🗑 Maishiy chiqindi',
      qurilish: '🧱 Qurilish chiqindisi',
      xazon: '🍂 Xazon va shoxlar',
      katta_hajmli: '🛋 Katta hajmli chiqindi',
      noqonuniy: '⚠️ Noqonuniy tashlandiq'
    };

    return (
      `📝 **Murojaat xulosasi:**\n\n` +
      `🏛 **Tuman:** ${session.districtName || 'Belgilangan tuman'}\n` +
      `🏘 **Mahalla:** ${session.mahallaName || 'Belgilangan mahalla'}\n` +
      `🗑 **Chiqindi turi:** ${wasteLabels[session.wasteType || 'maishiy'] || '🗑 Maishiy chiqindi'}\n` +
      `📍 **Mo‘ljal/Manzil:** ${session.address || 'Xarita yoki GPS orqali belgilangan'}\n` +
      (session.lat && session.lng ? `🌐 **Koordinatalar:** 📍 ${session.lat.toFixed(5)}, ${session.lng.toFixed(5)}\n\n` : '\n') +
      `Murojaatni mutasaddilarga yuborishni tasdiqlaysizmi?`
    );
  }

  private async sendDistrictSelection(ctx: any, selectedDistrictId?: number): Promise<void> {
    const districts = await this.districtsService.findAll();
    if (districts.length === 0) {
      await ctx.reply('Hozircha tizimda faol tumanlar kiritilmagan. Iltimos, keyinroq urinib ko‘ring.');
      return;
    }

    const buttons: any[][] = [];
    for (let i = 0; i < districts.length; i += 2) {
      const row = [];
      const d1 = districts[i];
      const isD1Selected = d1.id === selectedDistrictId;
      row.push(Markup.button.callback(`${isD1Selected ? '✅ ' : ''}${d1.name}`, `district_${d1.id}`));

      if (i + 1 < districts.length) {
        const d2 = districts[i + 1];
        const isD2Selected = d2.id === selectedDistrictId;
        row.push(Markup.button.callback(`${isD2Selected ? '✅ ' : ''}${d2.name}`, `district_${d2.id}`));
      }
      buttons.push(row);
    }

    const title = selectedDistrictId
      ? `🏛 **Tumanni o‘zgartirish:**\n\nQuyidagi ro‘yxatdan yangi tumanni tanlang:`
      : `Chiqindi toifasi qabul qilindi. ✅\n\nEndi hududni aniqlash uchun **tumaningizni** tanlang:`;

    await ctx.reply(title, {
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard(buttons)
    });
  }

  private async sendMahallaSelection(ctx: any, session: UserSession): Promise<void> {
    const districtId = session.districtId!;
    const districtName = session.districtName || 'Tuman';
    const mahallas = await this.mahallasService.findAll(districtId);

    if (mahallas.length > 0) {
      session.step = 'await_mahalla';

      const buttons: any[][] = [];
      // 2 buttons per row for compact clean layout
      for (let i = 0; i < mahallas.length; i += 2) {
        const row = [];
        const m1 = mahallas[i];
        const isM1Selected = m1.id === session.mahallaId;
        row.push(Markup.button.callback(`${isM1Selected ? '✅ ' : ''}${m1.name}`, `mahalla_${m1.id}`));

        if (i + 1 < mahallas.length) {
          const m2 = mahallas[i + 1];
          const isM2Selected = m2.id === session.mahallaId;
          row.push(Markup.button.callback(`${isM2Selected ? '✅ ' : ''}${m2.name}`, `mahalla_${m2.id}`));
        }
        buttons.push(row);
      }

      // Add options to change district or type manually
      buttons.push([
        Markup.button.callback('✍️ Mahallam ro‘yxatda yo‘q (nomini yozish)', 'custom_mahalla')
      ]);
      buttons.push([
        Markup.button.callback('🔄 Boshqa tumanni tanlash', 'change_district')
      ]);

      await ctx.reply(
        `🏛 **Tanlangan tuman:** ✅ **${districtName}**\n\n` +
        `Ushbu tumandagi **mahallangizni** tanlang:\n\n` +
        `_(Agar adashib boshqa tumanni tanlagan bo‘lsangiz, quyidagi "🔄 Boshqa tumanni tanlash" tugmasini bosing)_`,
        {
          parse_mode: 'Markdown',
          ...Markup.inlineKeyboard(buttons)
        }
      );
    } else {
      session.step = 'await_landmark';
      await ctx.reply(
        `🏛 **Tanlangan tuman:** ✅ **${districtName}**\n\n` +
        `Ushbu tumanda mahallalar ro‘yxati topilmadi.\n` +
        `Iltimos, chiqindi joylashgan aniq manzil yoki mo‘ljalni yozing:`,
        {
          parse_mode: 'Markdown',
          ...Markup.keyboard([
            ['🔄 Boshqa tumanni tanlash'],
            ['❌ Bekor qilish']
          ]).resize()
        }
      );
    }
  }

  private async sendLocationPrompt(ctx: any, session: UserSession): Promise<void> {
    const rawUrl = process.env.FRONTEND_URL || this.configService.get<string>('FRONTEND_URL', 'http://localhost:5173');
    const frontendUrl = (rawUrl || '').trim().replace(/\/+$/, '');
    const isHttps = typeof frontendUrl === 'string' && frontendUrl.toLowerCase().startsWith('https://');
    const districtName = session.districtName || '';
    const mahallaName = session.mahallaName || '';
    const miniAppUrl = `${frontendUrl}/location-picker?lat=${session.lat}&lng=${session.lng}&name=${encodeURIComponent(mahallaName)}&district=${encodeURIComponent(districtName)}`;

    const keyboardRows: any[] = [];
    if (isHttps) {
      keyboardRows.push([Markup.button.webApp('🗺 Xaritadan belgilash (Mini App)', miniAppUrl)]);
    }
    keyboardRows.push([Markup.button.locationRequest('📍 GPS Lokatsiyamni yuborish')]);
    keyboardRows.push(['➡️ Mo‘ljalsiz davom etish']);
    keyboardRows.push(['🔄 Tuman yoki mahallani o‘zgartirish', '❌ Bekor qilish']);

    await ctx.reply(
      `📍 **Tanlangan hudud:**\n` +
      `🏛 Tuman: **${districtName || 'Belgilangan'}**\n` +
      `🏘 Mahalla: **${mahallaName}** ✅\n\n` +
      `Chiqindi to‘plangan joyni belgilash uchun quyidagi qulay usullardan foydalaning:\n\n` +
      (isHttps ? `🗺 **1. Mini App:** Pastdagi **"🗺 Xaritadan belgilash (Mini App)"** tugmasini bosing;\n` : '') +
      `📍 **2. GPS:** Pastdagi **"📍 GPS Lokatsiyamni yuborish"** tugmasini bosing;\n` +
      `📎 **3. Telegram xaritasi:** Qisqich (📎 Скрепка -> Локация) orqali xaritadan istalgan nuqtani tanlab yuboring;\n` +
      `✍️ **4. Mo‘ljal yozish:** Mo‘ljalni matn sifatida yozib yuboring (masalan: 12-maktab orqasi):`,
      {
        parse_mode: 'Markdown',
        ...Markup.keyboard(keyboardRows).resize()
      }
    );
  }

  private async safeDeleteIncomingTextMessage(ctx: any): Promise<void> {
    try {
      if (ctx.message && 'message_id' in ctx.message) {
        await ctx.deleteMessage(ctx.message.message_id);
      }
    } catch {
      // Ignore: cannot delete non-deletable or expired messages
    }
  }

  private async findWorkerOrAdminByTelegramId(
    telegramId: string
  ): Promise<{ admin: AdminEntity | null; worker: WorkerEntity | null }> {
    const tid = String(telegramId);

    let worker = await this.workerRepo.findOne({
      where: { telegramId: tid, isActive: true },
      relations: ['district']
    });

    let admin = await this.adminRepo.findOne({
      where: { telegramId: tid, isActive: true },
      relations: ['district']
    });

    if (admin && !worker && admin.workerId) {
      worker = await this.workerRepo.findOne({
        where: { id: admin.workerId, isActive: true },
        relations: ['district']
      });
    }

    if (worker && !admin && worker.adminId) {
      admin = await this.adminRepo.findOne({
        where: { id: worker.adminId, isActive: true },
        relations: ['district']
      });
    }

    return { admin, worker };
  }

  private async sendWorkerTasks(ctx: any, workerId: number): Promise<void> {
    const tasks = await this.requestsService.findAssignedToWorker(workerId);
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

      if (t.description) {
        caption += `💬 <b>Izoh:</b> ${t.description}\n`;
      }

      const inlineButtons: any[] = [
        [Markup.button.callback('📸 Tozalangan rasmni yuklash', `done_${t.id}`)]
      ];

      if (t.lat && t.lng) {
        inlineButtons[0].push(
          Markup.button.url('🗺 Xaritada ochish', `https://maps.google.com/?q=${t.lat},${t.lng}`)
        );
      }

      await ctx.reply(caption, {
        parse_mode: 'HTML',
        reply_markup: { inline_keyboard: inlineButtons }
      });
    }
  }

  private async beginWorkerLogin(ctx: any): Promise<void> {
    const fromId = ctx.from?.id;
    if (!fromId) return;

    const { admin, worker } = await this.findWorkerOrAdminByTelegramId(String(fromId));
    if (admin || worker) {
      const name = admin?.fullName || worker?.fullName || 'Xodim';
      await ctx.reply(
        `Siz allaqachon tizimga xodim sifatida kirgansiz: <b>${name}</b>`,
        {
          parse_mode: 'HTML',
          reply_markup: WORKER_KEYBOARD.reply_markup
        }
      );
      const workerId = worker?.id || admin?.workerId;
      if (workerId) {
        await this.sendWorkerTasks(ctx, workerId);
      }
      return;
    }

    this.workerSessions.set(fromId, { step: 'awaiting_worker_username' });
    await ctx.reply(
      `🔐 <b>Xodim loginini (foydalanuvchi nomini) kiriting:</b>\n\n` +
      `<i>(Masalan: driver1_davlatobod)</i>`,
      {
        parse_mode: 'HTML',
        reply_markup: CANCEL_KEYBOARD.reply_markup
      }
    );
  }

  private async logoutWorker(ctx: any): Promise<void> {
    const fromId = ctx.from?.id;
    if (fromId) {
      await this.adminRepo.update({ telegramId: String(fromId) }, { telegramId: null });
      await this.workerRepo.update({ telegramId: String(fromId) }, { telegramId: null });
      this.workerSessions.delete(fromId);
    }

    await ctx.reply(
      `🚪 <b>Tizimdan chiqdingiz.</b>\n\nQayta kirish uchun quyidagi tugmani bosing yoki /login deb yozing:`,
      {
        parse_mode: 'HTML',
        reply_markup: GUEST_KEYBOARD.reply_markup
      }
    );
  }

  private async authenticateWorker(ctx: any, username: string, password: string): Promise<void> {
    const fromId = ctx.from?.id;
    if (!fromId) return;

    const normalizedUsername = username.trim().toLowerCase();
    const admin = await this.adminRepo.findOne({
      where: { username: normalizedUsername },
      relations: ['district']
    });

    if (!admin) {
      this.workerSessions.delete(fromId);
      await ctx.reply(
        `❌ <b>Bunday xodim (login: ${username}) topilmadi!</b>\n\n` +
        `Loginni to‘g‘ri kiritganingizni tekshiring yoki qaytadan urinish uchun /login ni bosing.`,
        {
          parse_mode: 'HTML',
          reply_markup: GUEST_KEYBOARD.reply_markup
        }
      );
      return;
    }

    if (!admin.isActive) {
      this.workerSessions.delete(fromId);
      await ctx.reply(
        `❌ <b>Ushbu xodim hisobi faolsizlantirilgan.</b>\n` +
        `Iltimos, tashkilot ma'muriyatiga murojaat qiling.`,
        {
          parse_mode: 'HTML',
          reply_markup: GUEST_KEYBOARD.reply_markup
        }
      );
      return;
    }

    if (admin.role === AdminRole.SUPERADMIN) {
      this.workerSessions.delete(fromId);
      await ctx.reply(
        `⚠️ <b>Bosh administrator Telegram orqali kira olmaydi.</b>\n` +
        `Iltimos, kompyuter/veb boshqaruv panelidan foydalaning.`,
        {
          parse_mode: 'HTML',
          reply_markup: GUEST_KEYBOARD.reply_markup
        }
      );
      return;
    }

    const isMatch = await bcrypt.compare(password, admin.passwordHash);
    if (!isMatch) {
      this.workerSessions.delete(fromId);
      await ctx.reply(
        `❌ <b>Parol noto‘g‘ri!</b>\n\n` +
        `Qaytadan urinish uchun /login ni bosing.`,
        {
          parse_mode: 'HTML',
          reply_markup: GUEST_KEYBOARD.reply_markup
        }
      );
      return;
    }

    // Unlink any prior records for this telegram id
    await this.adminRepo.update({ telegramId: String(fromId) }, { telegramId: null });
    await this.workerRepo.update({ telegramId: String(fromId) }, { telegramId: null });

    // Link telegram id to admin
    admin.telegramId = String(fromId);
    await this.adminRepo.save(admin);

    // Link telegram id to worker entity
    let worker: WorkerEntity | null = null;
    if (admin.workerId) {
      worker = await this.workerRepo.findOne({ where: { id: admin.workerId } });
    }
    if (!worker) {
      worker = await this.workerRepo.findOne({ where: { adminId: admin.id } });
    }
    if (!worker && admin.phone) {
      const cleanPhone = admin.phone.replace(/\D/g, '');
      worker = await this.workerRepo
        .createQueryBuilder('w')
        .where("REGEXP_REPLACE(w.phone, '\\D', '', 'g') = :phone", { phone: cleanPhone })
        .getOne();
    }

    // Auto-create or link worker if field staff
    if (!worker && (admin.role === AdminRole.DRIVER || admin.role === AdminRole.INSPECTOR)) {
      worker = this.workerRepo.create({
        districtId: admin.districtId || 1,
        fullName: admin.fullName,
        phone: admin.phone || '+998900000000',
        role: admin.role,
        adminId: admin.id,
        telegramId: String(fromId),
        isActive: true
      });
      worker = await this.workerRepo.save(worker);
      admin.workerId = worker.id;
      await this.adminRepo.save(admin);
    } else if (worker) {
      worker.telegramId = String(fromId);
      if (!worker.adminId) worker.adminId = admin.id;
      await this.workerRepo.save(worker);
      if (!admin.workerId) {
        admin.workerId = worker.id;
        await this.adminRepo.save(admin);
      }
    }

    this.workerSessions.delete(fromId);

    await ctx.reply(
      `✅ <b>Xush kelibsiz, ${admin.fullName}!</b>\n\n` +
      `🏢 <b>Lavozim:</b> ${admin.jobTitle || admin.role}\n` +
      `👤 <b>Login:</b> @${admin.username}\n\n` +
      `Telegram hisobingiz tizimga muvaffaqiyatli biriktirildi.`,
      {
        parse_mode: 'HTML',
        reply_markup: WORKER_KEYBOARD.reply_markup
      }
    );

    const targetWorkerId = worker?.id || admin.workerId;
    if (targetWorkerId) {
      await this.sendWorkerTasks(ctx, targetWorkerId);
    }
  }

  private registerWorkerHandlers(bot: Telegraf): void {
    bot.start(async (ctx) => {
      const fromId = ctx.from?.id;
      if (!fromId) return;

      const { admin, worker } = await this.findWorkerOrAdminByTelegramId(String(fromId));
      if (admin || worker) {
        const name = admin?.fullName || worker?.fullName || 'Xodim';
        const role = admin?.jobTitle || admin?.role || worker?.role || 'Xodim';
        await ctx.reply(
          `Assalomu alaykum, hurmatli <b>${name}</b>!\n` +
          `🏢 <b>Lavozim:</b> <i>${role}</i>\n` +
          `Siz "Toza Hudud" tizimida avtorizatsiyadan o‘tgansiz.`,
          {
            parse_mode: 'HTML',
            reply_markup: WORKER_KEYBOARD.reply_markup
          }
        );
        const workerId = worker?.id || admin?.workerId;
        if (workerId) {
          await this.sendWorkerTasks(ctx, workerId);
        }
      } else {
        this.workerSessions.delete(fromId);
        await ctx.reply(
          `🌿 <b>Assalomu alaykum! "Toza Hudud" xizmati xodimlari botiga xush kelibsiz.</b>\n\n` +
          `Botdan foydalanish uchun tizimdagi shaxsiy <b>Login</b> va <b>Parol</b>ingiz orqali kiring:`,
          {
            parse_mode: 'HTML',
            reply_markup: GUEST_KEYBOARD.reply_markup
          }
        );
      }
    });

    bot.command(['login', 'signin'], async (ctx) => {
      await this.beginWorkerLogin(ctx);
    });

    bot.hears(/^(🔑 Xodim sifatida kirish|Xodim sifatida kirish|Kirish|\/login|\/signin)$/i, async (ctx) => {
      await this.beginWorkerLogin(ctx);
    });

    bot.command(['logout', 'signout'], async (ctx) => {
      await this.logoutWorker(ctx);
    });

    bot.hears(/^(🚪 Tizimdan chiqish|Tizimdan chiqish|Chiqish|\/logout|\/signout)$/i, async (ctx) => {
      await this.logoutWorker(ctx);
    });

    bot.hears(/^(🚛 Biriktirilgan vazifalarim|Biriktirilgan vazifalarim|Vazifalarim)$/i, async (ctx) => {
      const fromId = ctx.from?.id;
      if (!fromId) return;

      const { admin, worker } = await this.findWorkerOrAdminByTelegramId(String(fromId));
      if (!admin && !worker) {
        await ctx.reply(
          `Siz hali tizimda avtorizatsiyadan o‘tmagansiz. Iltimos, /login buyrug‘ini bosing.`,
          {
            reply_markup: GUEST_KEYBOARD.reply_markup
          }
        );
        return;
      }

      const workerId = worker?.id || admin?.workerId;
      if (!workerId) {
        await ctx.reply(
          `Sizga biriktirilgan faol dala topshiriqlari mavjud emas.`,
          {
            reply_markup: WORKER_KEYBOARD.reply_markup
          }
        );
        return;
      }

      await this.sendWorkerTasks(ctx, workerId);
    });

    bot.hears(/^(📊 Mening hisobotlarim|Mening hisobotlarim|Hisobotlarim)$/i, async (ctx) => {
      const fromId = ctx.from?.id;
      if (!fromId) return;

      const { admin, worker } = await this.findWorkerOrAdminByTelegramId(String(fromId));
      if (!admin && !worker) {
        await ctx.reply(
          `Iltimos, avval /login buyrug‘i orqali avtorizatsiyadan o‘ting.`,
          {
            reply_markup: GUEST_KEYBOARD.reply_markup
          }
        );
        return;
      }

      const workerId = worker?.id || admin?.workerId;
      if (!workerId) {
        await ctx.reply(
          `📊 <b>Xodim ma'lumotlari:</b>\n\n` +
          `👤 <b>F.I.Sh:</b> ${admin?.fullName || 'Xodim'}\n` +
          `🏢 <b>Lavozim:</b> ${admin?.jobTitle || admin?.role}\n` +
          `🆔 <b>Login:</b> @${admin?.username || '-'}\n`,
          {
            parse_mode: 'HTML',
            reply_markup: WORKER_KEYBOARD.reply_markup
          }
        );
        return;
      }

      const completed = await this.requestsService.findCompletedByWorker(workerId);
      const active = await this.requestsService.findAssignedToWorker(workerId);
      const name = worker?.fullName || admin?.fullName || 'Xodim';
      const roleName = (worker?.role === 'Inspector' || admin?.role === AdminRole.INSPECTOR)
        ? 'Hudud nazoratchisi'
        : 'Maxsus texnika haydovchisi';

      await ctx.reply(
        `📊 <b>Xodim shaxsiy hisoboti:</b>\n\n` +
        `👤 <b>Xodim:</b> ${name}\n` +
        `🏷 <b>Lavozim:</b> ${roleName}\n` +
        `🚛 <b>Faol vazifalar soni:</b> ${active.length} ta\n` +
        `✅ <b>Bajarilgan va topshirilgan:</b> ${completed.length} ta\n\n` +
        `Shahrimiz tozaligiga qo‘shayotgan hissangiz uchun tashakkur!`,
        {
          parse_mode: 'HTML',
          reply_markup: WORKER_KEYBOARD.reply_markup
        }
      );
    });

    bot.hears(/^(❌ Bekor qilish|Bekor qilish|\/cancel)$/i, async (ctx) => {
      const fromId = ctx.from?.id;
      if (fromId) this.workerSessions.delete(fromId);
      const { admin, worker } = fromId ? await this.findWorkerOrAdminByTelegramId(String(fromId)) : { admin: null, worker: null };
      await ctx.reply(
        `Amal bekor qilindi.`,
        {
          reply_markup: (admin || worker) ? WORKER_KEYBOARD.reply_markup : GUEST_KEYBOARD.reply_markup
        }
      );
    });

    bot.action(/done_(\d+)/, async (ctx) => {
      const fromId = ctx.from?.id;
      if (!fromId) return;

      const reqId = Number(ctx.match[1]);
      this.workerSessions.set(fromId, { step: 'await_after_photo', activeRequestId: reqId });

      await ctx.answerCbQuery();
      await ctx.reply(
        `📸 <b>Murojaat #${reqId} bo‘yicha tozalash ishlari bajarilganini tasdiqlovchi fotosuratni yuboring:</b>`,
        {
          parse_mode: 'HTML',
          reply_markup: CANCEL_KEYBOARD.reply_markup
        }
      );
    });

    bot.on('contact', async (ctx) => {
      const fromId = ctx.from?.id;
      if (!fromId) return;

      const phone = ctx.message.contact.phone_number;
      const cleanPhone = phone.replace(/\D/g, '');
      const worker = await this.workerRepo
        .createQueryBuilder('w')
        .where("REGEXP_REPLACE(w.phone, '\\D', '', 'g') = :phone", { phone: cleanPhone })
        .andWhere('w.isActive = true')
        .getOne();

      if (worker) {
        await this.workerRepo.update(worker.id, { telegramId: String(fromId) });
        if (worker.adminId) {
          await this.adminRepo.update(worker.adminId, { telegramId: String(fromId) });
        }
        await ctx.reply(
          `Tabriklaymiz, <b>${worker.fullName}</b>! ✅\n\nTelegram hisobingiz tizimga muvaffaqiyatli biriktirildi.`,
          {
            parse_mode: 'HTML',
            reply_markup: WORKER_KEYBOARD.reply_markup
          }
        );
        await this.sendWorkerTasks(ctx, worker.id);
      } else {
        await ctx.reply(
          `Kechirasiz, bu raqam tizimda topilmadi. Iltimos, /login buyrug‘i orqali login va parol bilan kiring.`,
          {
            reply_markup: GUEST_KEYBOARD.reply_markup
          }
        );
      }
    });

    bot.on('photo', async (ctx) => {
      const fromId = ctx.from?.id;
      if (!fromId) return;

      const session = this.workerSessions.get(fromId);
      if (session?.step === 'await_after_photo' && session.activeRequestId) {
        const photos = ctx.message.photo;
        const highestRes = photos[photos.length - 1];

        try {
          const fileLink = await ctx.telegram.getFileLink(highestRes.file_id);
          const savedPath = await this.downloadTelegramFile(fileLink.href);

          await this.requestsService.submitWork(session.activeRequestId, savedPath);
          const reqId = session.activeRequestId;
          this.workerSessions.delete(fromId);

          await ctx.reply(
            `🎉 <b>Rahmat! Murojaat #${reqId} bo‘yicha tozalash fotosurati qabul qilindi.</b>\n\n` +
            `Murojaat muvaffaqiyatli topshirildi va dispetcher tasdig‘iga yuborildi.`,
            {
              parse_mode: 'HTML',
              reply_markup: WORKER_KEYBOARD.reply_markup
            }
          );
        } catch (err) {
          this.logger.error('Xodim rasmini saqlashda xatolik:', err);
          await ctx.reply('Rasmni yuklashda xatolik yuz berdi. Iltimos qaytadan yuboring.');
        }
      }
    });

    bot.on('text', async (ctx, next) => {
      const fromId = ctx.from?.id;
      if (!fromId) return next();

      const text = ctx.message && 'text' in ctx.message ? String(ctx.message.text || '').trim() : '';
      if (!text || text.startsWith('/')) return next();

      const session = this.workerSessions.get(fromId);
      if (!session) return next();

      if (session.step === 'awaiting_worker_username') {
        await this.safeDeleteIncomingTextMessage(ctx);
        session.pendingUsername = text.toLowerCase();
        session.step = 'awaiting_worker_password';
        await ctx.reply(
          `🔑 <b>Parolni kiriting:</b>`,
          {
            parse_mode: 'HTML',
            reply_markup: CANCEL_KEYBOARD.reply_markup
          }
        );
        return;
      }

      if (session.step === 'awaiting_worker_password') {
        await this.safeDeleteIncomingTextMessage(ctx);
        const username = session.pendingUsername;
        if (!username) {
          session.step = 'awaiting_worker_username';
          await ctx.reply(
            `Foydalanuvchi nomini qaytadan kiriting:`,
            {
              reply_markup: CANCEL_KEYBOARD.reply_markup
            }
          );
          return;
        }

        await this.authenticateWorker(ctx, username, text);
        return;
      }

      return next();
    });
  }

  private async downloadTelegramFile(fileUrl: string): Promise<string> {
    if (!existsSync(UPLOAD_DIR)) {
      mkdirSync(UPLOAD_DIR, { recursive: true });
    }

    const filename = `tg-${Date.now()}-${Math.round(Math.random() * 1e9)}.jpg`;
    const fullPath = join(UPLOAD_DIR, filename);

    const response = await axios({
      method: 'GET',
      url: fileUrl,
      responseType: 'stream'
    });

    const writer = createWriteStream(fullPath);
    response.data.pipe(writer);

    return new Promise((resolve, reject) => {
      writer.on('finish', () => resolve(`/uploads/${filename}`));
      writer.on('error', reject);
    });
  }
}

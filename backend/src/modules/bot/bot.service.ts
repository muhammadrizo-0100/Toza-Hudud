import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Telegraf } from 'telegraf';
import { UserSession, WorkerSession } from './bot.types';
import { BotNotificationsService } from './bot-notifications.service';
import { PublicBotService } from './public-bot.service';
import { WorkerBotService } from './worker-bot.service';

@Injectable()
export class BotService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(BotService.name);
  private bot: Telegraf | null = null;
  private workerBot: Telegraf | null = null;

  private readonly sessions = new Map<number, UserSession>();
  private readonly workerSessions = new Map<number, WorkerSession>();

  constructor(
    private readonly configService: ConfigService,
    private readonly notificationsService: BotNotificationsService,
    private readonly publicBotService: PublicBotService,
    private readonly workerBotService: WorkerBotService
  ) {}

  async onModuleInit(): Promise<void> {
    this.notificationsService.setupListeners(
      () => this.bot,
      () => this.workerBot,
      this.workerSessions
    );

    const citizenToken = this.configService.get<string>('TELEGRAM_BOT_TOKEN');
    const workerToken = this.configService.get<string>('TELEGRAM_WORKER_BOT_TOKEN');

    if (citizenToken) {
      await this.initCitizenBot(citizenToken);
    } else {
      this.logger.warn('TELEGRAM_BOT_TOKEN kiritilmagan.');
    }

    if (workerToken) {
      await this.initWorkerBot(workerToken);
    } else {
      this.logger.warn('TELEGRAM_WORKER_BOT_TOKEN kiritilmagan.');
    }
  }

  onModuleDestroy(): void {
    if (this.bot) this.bot.stop('Shutdown');
    if (this.workerBot) this.workerBot.stop('Shutdown');
  }

  private async initCitizenBot(token: string): Promise<void> {
    try {
      this.bot = new Telegraf(token);
      this.bot.catch((err: any) => {
        this.logger.error(`Fuqaro boti ichki xatoligi:`, err?.message || err);
      });

      this.publicBotService.registerHandlers(this.bot, this.sessions);

      const me = await this.bot.telegram.getMe();
      this.logger.log(`🌿 Fuqaro Telegram Boti @${me.username || 'unknown'} muvaffaqiyatli ulandi!`);

      this.launchWithAutoRetry(this.bot, 'Fuqaro');
    } catch (err) {
      this.logger.error('Fuqaro Telegram botini ishga tushirishda xatolik:', err);
    }
  }

  private async initWorkerBot(token: string): Promise<void> {
    try {
      this.workerBot = new Telegraf(token);
      this.workerBot.catch((err: any) => {
        this.logger.error(`Xodim boti ichki xatoligi:`, err?.message || err);
      });

      this.workerBotService.registerHandlers(this.workerBot, this.workerSessions);

      const meWorker = await this.workerBot.telegram.getMe();
      this.logger.log(`🚛 Xodim Telegram Boti @${meWorker.username || 'unknown'} muvaffaqiyatli ulandi!`);

      this.launchWithAutoRetry(this.workerBot, 'Xodim');
    } catch (err) {
      this.logger.error('Xodim Telegram botini ishga tushirishda xatolik:', err);
    }
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
}

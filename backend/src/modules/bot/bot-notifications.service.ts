import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Telegraf, Markup } from 'telegraf';
import { RealtimeService } from '../../common/realtime/realtime.service';
import { WorkerEntity } from '../../database/entities/worker.entity';
import { RequestEntity } from '../../database/entities/request.entity';
import { WORKER_KEYBOARD } from './bot-keyboards.helper';
import { WorkerSession } from './bot.types';
import {
  buildWorkerAssignmentNotification,
  buildCitizenAssignmentNotification,
  buildWorkerSubmittedNotification,
  buildCitizenCompletedNotification,
  buildWorkerCompletedNotification,
  buildWorkerRejectedNotification
} from './bot-notification-templates.helper';

@Injectable()
export class BotNotificationsService {
  private readonly logger = new Logger(BotNotificationsService.name);

  constructor(
    private readonly realtimeService: RealtimeService,
    @InjectRepository(WorkerEntity)
    private readonly workerRepo: Repository<WorkerEntity>
  ) {}

  setupListeners(
    getCitizenBot: () => Telegraf | null,
    getWorkerBot: () => Telegraf | null,
    workerSessions: Map<number, WorkerSession>
  ): void {
    this.realtimeService.onRequestAssigned(async ({ request, worker, isReassignment }) => {
      const workerBot = getWorkerBot();
      const citizenBot = getCitizenBot();

      if (workerBot && worker.telegramId) {
        await this.notifyWorkerAssignment(workerBot, request, worker, Boolean(isReassignment));
      }

      if (citizenBot && request.citizenTelegramId) {
        await this.notifyCitizenAssignment(citizenBot, request, worker, Boolean(isReassignment));
      }
    });

    this.realtimeService.onRequestSubmitted(async ({ request, worker }) => {
      this.clearWorkerSessionsForRequest(workerSessions, request.id);
      const workerBot = getWorkerBot();
      if (workerBot) {
        await this.notifyWorkerSubmitted(workerBot, request, worker);
      }
    });

    this.realtimeService.onRequestCompleted(async ({ request, worker }) => {
      this.clearWorkerSessionsForRequest(workerSessions, request.id);
      const citizenBot = getCitizenBot();
      if (citizenBot && request.citizenTelegramId) {
        await this.notifyCitizenCompleted(citizenBot, request);
      }
      const workerBot = getWorkerBot();
      if (workerBot) {
        await this.notifyWorkerCompleted(workerBot, request, worker);
      }
    });

    this.realtimeService.onRequestRejected(async ({ request, reason, worker }) => {
      this.clearWorkerSessionsForRequest(workerSessions, request.id);
      const workerBot = getWorkerBot();
      if (workerBot) {
        await this.notifyWorkerRejected(workerBot, request, reason, worker);
      }
    });
  }

  private clearWorkerSessionsForRequest(sessions: Map<number, WorkerSession>, requestId: number): void {
    for (const [tgId, sess] of sessions.entries()) {
      if (sess.activeRequestId === requestId) {
        sessions.delete(tgId);
      }
    }
  }

  private async notifyWorkerAssignment(
    bot: Telegraf,
    request: RequestEntity,
    worker: WorkerEntity,
    isReassignment: boolean
  ): Promise<void> {
    try {
      const text = buildWorkerAssignmentNotification(request, worker, isReassignment);
      const buttons: any[] = [[Markup.button.callback('📸 Hisobot yuklash (Bajarildi)', `done_${request.id}`)]];
      if (request.lat && request.lng) {
        buttons[0].push(Markup.button.url('📍 Xaritada ko‘rish', `https://maps.google.com/?q=${request.lat},${request.lng}`));
      }

      await bot.telegram.sendMessage(worker.telegramId!, text, {
        parse_mode: 'HTML',
        reply_markup: { inline_keyboard: buttons }
      });
    } catch (err: any) {
      this.logger.warn(`Worker Telegram bildirishnomasi yuborilmadi: ${err.message}`);
    }
  }

  private async notifyCitizenAssignment(
    bot: Telegraf,
    request: RequestEntity,
    worker: WorkerEntity,
    isReassignment: boolean
  ): Promise<void> {
    try {
      const text = buildCitizenAssignmentNotification(request, worker, isReassignment);
      await bot.telegram.sendMessage(request.citizenTelegramId!, text, { parse_mode: 'HTML' });
    } catch (err: any) {
      this.logger.warn(`Fuqaro Telegram bildirishnomasi yuborilmadi: ${err.message}`);
    }
  }

  private async notifyWorkerSubmitted(bot: Telegraf, request: RequestEntity, worker?: WorkerEntity | null): Promise<void> {
    try {
      const targetWorker = worker || (request.assignedWorkerId ? await this.workerRepo.findOne({ where: { id: request.assignedWorkerId } }) : null);
      if (targetWorker?.telegramId) {
        const text = buildWorkerSubmittedNotification(request);
        await bot.telegram.sendMessage(targetWorker.telegramId, text, {
          parse_mode: 'HTML',
          reply_markup: WORKER_KEYBOARD.reply_markup
        });
      }
    } catch (err: any) {
      this.logger.warn(`Worker hisobot bildirishnomasi yuborilmadi: ${err.message}`);
    }
  }

  private async notifyCitizenCompleted(bot: Telegraf, request: RequestEntity): Promise<void> {
    try {
      const text = buildCitizenCompletedNotification(request);
      await bot.telegram.sendMessage(request.citizenTelegramId!, text, { parse_mode: 'HTML' });
    } catch (err: any) {
      this.logger.warn(`Fuqaro yakunlash bildirishnomasi yuborilmadi: ${err.message}`);
    }
  }

  private async notifyWorkerCompleted(bot: Telegraf, request: RequestEntity, worker?: WorkerEntity | null): Promise<void> {
    try {
      const targetWorker = worker || (request.assignedWorkerId ? await this.workerRepo.findOne({ where: { id: request.assignedWorkerId } }) : null);
      if (targetWorker?.telegramId) {
        const text = buildWorkerCompletedNotification(request);
        await bot.telegram.sendMessage(targetWorker.telegramId, text, {
          parse_mode: 'HTML',
          reply_markup: WORKER_KEYBOARD.reply_markup
        });
      }
    } catch (err: any) {
      this.logger.warn(`Worker yakunlash bildirishnomasi yuborilmadi: ${err.message}`);
    }
  }

  private async notifyWorkerRejected(
    bot: Telegraf,
    request: RequestEntity,
    reason: string | undefined,
    worker?: WorkerEntity | null
  ): Promise<void> {
    try {
      const targetWorker = worker || (request.assignedWorkerId ? await this.workerRepo.findOne({ where: { id: request.assignedWorkerId } }) : null);
      if (targetWorker?.telegramId) {
        const text = buildWorkerRejectedNotification(request, reason);
        const buttons: any[] = [[Markup.button.callback('📸 Qayta hisobot yuklash', `done_${request.id}`)]];
        if (request.lat && request.lng) {
          buttons[0].push(Markup.button.url('📍 Xaritada ko‘rish', `https://maps.google.com/?q=${request.lat},${request.lng}`));
        }

        await bot.telegram.sendMessage(targetWorker.telegramId, text, {
          parse_mode: 'HTML',
          reply_markup: { inline_keyboard: buttons }
        });
      }
    } catch (err: any) {
      this.logger.warn(`Worker rad etish bildirishnomasi yuborilmadi: ${err.message}`);
    }
  }
}

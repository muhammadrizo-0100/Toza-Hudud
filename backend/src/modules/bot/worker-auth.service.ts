import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { AdminEntity, AdminRole } from '../../database/entities/admin.entity';
import { WorkerEntity } from '../../database/entities/worker.entity';
import { WorkerSession } from './bot.types';
import { WORKER_KEYBOARD, GUEST_KEYBOARD, CANCEL_KEYBOARD } from './bot-keyboards.helper';

@Injectable()
export class WorkerAuthService {
  private readonly logger = new Logger(WorkerAuthService.name);

  constructor(
    @InjectRepository(AdminEntity)
    private readonly adminRepo: Repository<AdminEntity>,
    @InjectRepository(WorkerEntity)
    private readonly workerRepo: Repository<WorkerEntity>
  ) {}

  async findWorkerOrAdminByTelegramId(
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

  async beginWorkerLogin(ctx: any, sessions: Map<number, WorkerSession>): Promise<void> {
    const fromId = ctx.from?.id;
    if (!fromId) return;

    const { admin, worker } = await this.findWorkerOrAdminByTelegramId(String(fromId));
    if (admin || worker) {
      const name = admin?.fullName || worker?.fullName || 'Xodim';
      await ctx.reply(`Siz allaqachon tizimga xodim sifatida kirgansiz: <b>${name}</b>`, {
        parse_mode: 'HTML',
        reply_markup: WORKER_KEYBOARD.reply_markup
      });
      return;
    }

    sessions.set(fromId, { step: 'awaiting_worker_username' });
    await ctx.reply(
      `🔐 <b>Xodim loginini (foydalanuvchi nomini) kiriting:</b>\n\n<i>(Masalan: driver1_davlatobod)</i>`,
      {
        parse_mode: 'HTML',
        reply_markup: CANCEL_KEYBOARD.reply_markup
      }
    );
  }

  async logoutWorker(ctx: any, sessions: Map<number, WorkerSession>): Promise<void> {
    const fromId = ctx.from?.id;
    if (fromId) {
      await this.adminRepo.update({ telegramId: String(fromId) }, { telegramId: null });
      await this.workerRepo.update({ telegramId: String(fromId) }, { telegramId: null });
      sessions.delete(fromId);
    }

    await ctx.reply(
      `🚪 <b>Tizimdan chiqdingiz.</b>\n\nQayta kirish uchun quyidagi tugmani bosing yoki /login deb yozing:`,
      {
        parse_mode: 'HTML',
        reply_markup: GUEST_KEYBOARD.reply_markup
      }
    );
  }

  async authenticateWorker(
    ctx: any,
    username: string,
    password: string,
    sessions: Map<number, WorkerSession>
  ): Promise<{ workerId?: number }> {
    const fromId = ctx.from?.id;
    if (!fromId) return {};

    const normalizedUsername = username.trim().toLowerCase();
    const admin = await this.adminRepo.findOne({
      where: { username: normalizedUsername },
      relations: ['district']
    });

    if (!admin) {
      sessions.delete(fromId);
      await ctx.reply(
        `❌ <b>Bunday xodim (login: ${username}) topilmadi!</b>\n\nLoginni to‘g‘ri kiritganingizni tekshiring yoki qaytadan urinish uchun /login ni bosing.`,
        { parse_mode: 'HTML', reply_markup: GUEST_KEYBOARD.reply_markup }
      );
      return {};
    }

    if (!admin.isActive) {
      sessions.delete(fromId);
      await ctx.reply(`❌ <b>Ushbu xodim hisobi faolsizlantirilgan.</b>\nIltimos, tashkilot ma'muriyatiga murojaat qiling.`, {
        parse_mode: 'HTML',
        reply_markup: GUEST_KEYBOARD.reply_markup
      });
      return {};
    }

    if (admin.role === AdminRole.SUPERADMIN) {
      sessions.delete(fromId);
      await ctx.reply(`⚠️ <b>Bosh administrator Telegram orqali kira olmaydi.</b>\nIltimos, kompyuter/veb boshqaruv panelidan foydalaning.`, {
        parse_mode: 'HTML',
        reply_markup: GUEST_KEYBOARD.reply_markup
      });
      return {};
    }

    const isMatch = await bcrypt.compare(password, admin.passwordHash);
    if (!isMatch) {
      sessions.delete(fromId);
      await ctx.reply(`❌ <b>Parol noto‘g‘ri!</b>\n\nQaytadan urinish uchun /login ni bosing.`, {
        parse_mode: 'HTML',
        reply_markup: GUEST_KEYBOARD.reply_markup
      });
      return {};
    }

    await this.adminRepo.update({ telegramId: String(fromId) }, { telegramId: null });
    await this.workerRepo.update({ telegramId: String(fromId) }, { telegramId: null });

    admin.telegramId = String(fromId);
    await this.adminRepo.save(admin);

    const worker = await this.linkWorkerRecord(admin, fromId);
    sessions.delete(fromId);

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

    return { workerId: worker?.id || admin.workerId || undefined };
  }

  private async linkWorkerRecord(admin: AdminEntity, fromId: number): Promise<WorkerEntity | null> {
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

    return worker;
  }
}

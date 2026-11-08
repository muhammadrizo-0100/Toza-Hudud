import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { RequestEntity, RequestStatus, RequestSource } from '../../database/entities/request.entity';
import { NotificationEntity } from '../../database/entities/notification.entity';
import { WorkerEntity } from '../../database/entities/worker.entity';
import { AdminRole } from '../../database/entities/admin.entity';
import { JwtPayload } from '../auth/types/jwt-payload.type';
import { RealtimeService } from '../../common/realtime/realtime.service';

export interface CreateRequestInput {
  districtId: number;
  mahallaId?: number | null;
  mahallaName?: string | null;
  source?: RequestSource;
  citizenPhone?: string | null;
  citizenTelegramId?: string | null;
  citizenFullName?: string | null;
  beforePhotoUrl: string;
  wasteType?: string | null;
  lat?: number | null;
  lng?: number | null;
  address?: string | null;
  description?: string | null;
}

export interface RequestFilterParams {
  districtId?: number;
  mahallaId?: number;
  workerId?: number;
  status?: RequestStatus;
  wasteType?: string;
  page?: number;
  limit?: number;
  startDate?: string;
  endDate?: string;
  search?: string;
}

@Injectable()
export class RequestsService {
  private readonly logger = new Logger(RequestsService.name);

  constructor(
    @InjectRepository(RequestEntity)
    private readonly requestRepo: Repository<RequestEntity>,
    @InjectRepository(NotificationEntity)
    private readonly notificationRepo: Repository<NotificationEntity>,
    @InjectRepository(WorkerEntity)
    private readonly workerRepo: Repository<WorkerEntity>,
    private readonly realtimeService: RealtimeService
  ) {}

  async findAll(filters: RequestFilterParams, user?: JwtPayload | null) {
    const qb = this.requestRepo
      .createQueryBuilder('r')
      .leftJoinAndSelect('r.district', 'd')
      .leftJoinAndSelect('r.mahalla', 'm')
      .leftJoinAndSelect('r.assignedWorker', 'w');

    // Scoping by user role
    if (user && (user.role === AdminRole.INSPECTOR || user.role === AdminRole.DRIVER)) {
      if (user.workerId) {
        qb.andWhere('r.assigned_worker_id = :myWorkerId', { myWorkerId: user.workerId });
      } else if (user.districtId) {
        qb.andWhere('r.district_id = :userDistrictId', { userDistrictId: user.districtId });
      }
    } else if (user && (user.role === AdminRole.DISPATCHER || user.role === AdminRole.MANAGER) && user.districtId) {
      qb.andWhere('r.district_id = :userDistrictId', { userDistrictId: user.districtId });
    } else if (filters.districtId) {
      qb.andWhere('r.district_id = :districtId', { districtId: filters.districtId });
    }

    if (filters.workerId) {
      qb.andWhere('r.assigned_worker_id = :workerId', { workerId: filters.workerId });
    }

    if (filters.mahallaId) {
      qb.andWhere('r.mahalla_id = :mahallaId', { mahallaId: filters.mahallaId });
    }

    if (filters.status) {
      qb.andWhere('r.status = :status', { status: filters.status });
    }

    if (filters.wasteType && filters.wasteType !== 'all') {
      qb.andWhere('r.wasteType = :wasteType', { wasteType: filters.wasteType });
    }

    if (filters.startDate) {
      qb.andWhere('r.createdAt >= :startDate', { startDate: new Date(filters.startDate) });
    }

    if (filters.endDate) {
      qb.andWhere('r.createdAt <= :endDate', { endDate: new Date(filters.endDate) });
    }

    if (filters.search) {
      const s = `%${filters.search.toLowerCase()}%`;
      qb.andWhere(
        '(LOWER(r.address) LIKE :s OR LOWER(r.description) LIKE :s OR LOWER(r.mahallaName) LIKE :s OR LOWER(r.citizenFullName) LIKE :s OR r.citizenPhone LIKE :s)',
        { s }
      );
    }

    qb.orderBy('r.createdAt', 'DESC');

    const page = Math.max(1, Number(filters.page || 1));
    const limit = Math.min(100, Math.max(1, Number(filters.limit || 15)));
    const offset = (page - 1) * limit;

    const [items, total] = await qb.skip(offset).take(limit).getManyAndCount();
    const totalPages = Math.ceil(total / limit) || 1;

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasPrev: page > 1,
        hasNext: page < totalPages
      }
    };
  }

  async findOne(id: number): Promise<RequestEntity> {
    const item = await this.requestRepo.findOne({
      where: { id },
      relations: ['district', 'mahalla', 'assignedWorker']
    });

    if (!item) {
      throw new NotFoundException(`Murojaat #${id} topilmadi`);
    }

    return item;
  }

  async create(input: CreateRequestInput, actorAdminId?: number): Promise<RequestEntity> {
    if (!input.beforePhotoUrl) {
      throw new BadRequestException('Chiqindining rasmi yuklanishi shart');
    }

    const request = this.requestRepo.create({
      districtId: input.districtId,
      mahallaId: input.mahallaId || null,
      mahallaName: input.mahallaName || null,
      source: input.source || RequestSource.TELEGRAM,
      citizenPhone: input.citizenPhone || null,
      citizenTelegramId: input.citizenTelegramId || null,
      citizenFullName: input.citizenFullName || null,
      beforePhotoUrl: input.beforePhotoUrl,
      wasteType: input.wasteType || 'maishiy',
      lat: input.lat || null,
      lng: input.lng || null,
      address: input.address || null,
      description: input.description || null,
      status: RequestStatus.NEW
    });

    const saved = await this.requestRepo.save(request);

    // Create Notification in DB
    const notification = this.notificationRepo.create({
      districtId: saved.districtId,
      recipientAdminId: null, // broadcast to all admins of this district and superadmins
      requestId: saved.id,
      kind: 'created',
      title: `Yangi chiqindi murojaati #${saved.id}`,
      message: `${saved.mahallaName || 'Mahalla'} — ${saved.address || 'Manzil ko‘rsatilmagan'}`,
      status: RequestStatus.NEW,
      isRead: false
    });
    const savedNotification = await this.notificationRepo.save(notification);

    // Emit real-time socket events
    this.realtimeService.emitRequestCreated(saved);
    this.realtimeService.emitNotification(savedNotification, actorAdminId);

    return saved;
  }

  async assignWorker(requestId: number, workerId: number, actorAdminId?: number): Promise<RequestEntity> {
    const request = await this.findOne(requestId);
    const worker = await this.workerRepo.findOne({ where: { id: workerId } });

    if (!worker) {
      throw new NotFoundException(`Xodim #${workerId} topilmadi`);
    }

    const isReassignment = request.status === RequestStatus.REJECTED || (!!request.assignedWorkerId && request.assignedWorkerId !== worker.id);
    request.assignedWorkerId = worker.id;
    request.assignedWorker = worker;
    request.status = RequestStatus.IN_PROGRESS;
    request.assignedAt = new Date();
    // Qayta biriktirilganda avvalgi rad etish sababi tozalanadi va jarayonga qaytadi
    request.rejectionReason = null;

    const saved = await this.requestRepo.save(request);

    // In-app notification for the worker's cabinet (if they have an admin account)
    if (worker.adminId) {
      const notif = this.notificationRepo.create({
        districtId: saved.districtId,
        recipientAdminId: worker.adminId,
        requestId: saved.id,
        kind: 'assignment',
        title: isReassignment ? `Qayta biriktirilgan topshiriq #${saved.id}` : `Yangi topshiriq biriktirildi #${saved.id}`,
        message: `${saved.mahallaName || 'Hudud'} — ${saved.address || 'Manzil ko‘rsatilmagan'}`,
        status: RequestStatus.IN_PROGRESS,
        isRead: false
      });
      const savedNotif = await this.notificationRepo.save(notif);
      this.realtimeService.emitNotification(savedNotif, actorAdminId);
    }

    // Emit real-time event (triggers WebSocket and Bot handlers)
    this.realtimeService.emitRequestAssigned(saved, worker, isReassignment);

    return saved;
  }

  async submitWork(requestId: number, afterPhotoUrl: string, actorAdminId?: number): Promise<RequestEntity> {
    if (!afterPhotoUrl) {
      throw new BadRequestException('Tozalangan joyning rasmi yuklanishi shart');
    }

    const request = await this.findOne(requestId);

    // Idempotency & state guards: prevent duplicate submissions or submitting completed tasks
    if (request.status === RequestStatus.COMPLETED) {
      throw new BadRequestException('Bu topshiriq allaqachon dispetcher tomonidan tasdiqlangan va yakunlangan!');
    }
    if (request.status === RequestStatus.SUBMITTED) {
      throw new BadRequestException('Bu topshiriq bo‘yicha hisobot allaqachon yuklangan va dispetcher tasdig‘i kutilmoqda!');
    }

    request.afterPhotoUrl = afterPhotoUrl;
    request.status = RequestStatus.SUBMITTED;
    request.submittedAt = new Date();

    const saved = await this.requestRepo.save(request);

    // Resolve assigned worker
    let worker: WorkerEntity | null = null;
    let submittingActorId = actorAdminId;
    if (saved.assignedWorkerId) {
      worker = await this.workerRepo.findOne({ where: { id: saved.assignedWorkerId } });
      if (!submittingActorId && worker?.adminId) {
        submittingActorId = worker.adminId;
      }
    }

    // Notification for dispetcher
    const notif = this.notificationRepo.create({
      districtId: saved.districtId,
      recipientAdminId: null,
      requestId: saved.id,
      kind: 'submitted',
      title: `Tozalash yakunlandi (Tasdiq kutilmoqda) #${saved.id}`,
      message: `${saved.mahallaName || 'Hudud'} tozalangani haqida xodim hisobot yukladi`,
      status: RequestStatus.SUBMITTED,
      isRead: false
    });
    const savedNotif = await this.notificationRepo.save(notif);

    this.realtimeService.emitRequestSubmitted(saved, worker);
    this.realtimeService.emitNotification(savedNotif, submittingActorId);

    return saved;
  }

  async verifyWork(requestId: number, actorAdminId?: number): Promise<RequestEntity> {
    const request = await this.findOne(requestId);
    if (request.status !== RequestStatus.SUBMITTED) {
      throw new BadRequestException('Faqat xodim tozalash fotohisobotini yuklagan murojaatni qabul qilish mumkin');
    }
    request.status = RequestStatus.COMPLETED;
    request.completedAt = new Date();

    const saved = await this.requestRepo.save(request);

    // In-app notification for the worker
    let worker: WorkerEntity | null = null;
    if (saved.assignedWorkerId) {
      worker = await this.workerRepo.findOne({ where: { id: saved.assignedWorkerId } });
      if (worker?.adminId) {
        const notif = this.notificationRepo.create({
          districtId: saved.districtId,
          recipientAdminId: worker.adminId,
          requestId: saved.id,
          kind: 'completed',
          title: `Ish qabul qilindi #${saved.id}`,
          message: `${saved.mahallaName || 'Hudud'} bo‘yicha tozalash hisobotingiz tasdiqlandi`,
          status: RequestStatus.COMPLETED,
          isRead: false
        });
        const savedNotif = await this.notificationRepo.save(notif);
        this.realtimeService.emitNotification(savedNotif, actorAdminId);
      }
    }

    this.realtimeService.emitRequestCompleted(saved, worker);

    return saved;
  }

  async rejectWork(requestId: number, reason?: string, actorAdminId?: number): Promise<RequestEntity> {
    const cleanReason = (reason || '').trim();
    if (!cleanReason) {
      throw new BadRequestException('Rad etish sababini kiritish majburiy!');
    }

    const request = await this.findOne(requestId);
    request.status = RequestStatus.REJECTED;
    request.rejectionReason = cleanReason;

    const saved = await this.requestRepo.save(request);

    let worker: WorkerEntity | null = null;
    if (saved.assignedWorkerId) {
      worker = await this.workerRepo.findOne({ where: { id: saved.assignedWorkerId } });
    }

    this.realtimeService.emitRequestRejected(saved, cleanReason, worker);

    // In-app notification for dispetcher/management (recipientAdminId: null means district dispatchers/admins)
    const notif = this.notificationRepo.create({
      districtId: saved.districtId,
      recipientAdminId: null,
      requestId: saved.id,
      kind: 'rejected',
      title: `Topshiriq rad etildi #${saved.id}`,
      message: `Rad etish sababi: ${cleanReason}`,
      status: RequestStatus.REJECTED,
      isRead: false
    });
    const savedNotif = await this.notificationRepo.save(notif);
    this.realtimeService.emitNotification(savedNotif, actorAdminId);

    // Also notify assigned worker if actor is someone else
    if (worker?.adminId && worker.adminId !== actorAdminId) {
      const workerNotif = this.notificationRepo.create({
        districtId: saved.districtId,
        recipientAdminId: worker.adminId,
        requestId: saved.id,
        kind: 'rejected',
        title: `Murojaat rad etildi #${saved.id}`,
        message: `Sabab: ${cleanReason}`,
        status: RequestStatus.REJECTED,
        isRead: false
      });
      const savedWorkerNotif = await this.notificationRepo.save(workerNotif);
      this.realtimeService.emitNotification(savedWorkerNotif, actorAdminId);
    }

    return saved;
  }

  async getMapPoints(districtId?: number): Promise<Array<{
    id: number;
    lat: number;
    lng: number;
    status: RequestStatus;
    mahallaName: string | null;
    address: string | null;
    beforePhotoUrl: string;
    createdAt: Date;
    completedAt: Date | null;
  }>> {
    const qb = this.requestRepo
      .createQueryBuilder('r')
      .select([
        'r.id',
        'r.lat',
        'r.lng',
        'r.status',
        'r.mahallaName',
        'r.address',
        'r.beforePhotoUrl',
        'r.createdAt',
        'r.completedAt'
      ])
      .where('r.lat IS NOT NULL')
      .andWhere('r.lng IS NOT NULL')
      .andWhere("r.status != 'rejected'");

    if (districtId) {
      qb.andWhere('r.district_id = :districtId', { districtId });
    }

    const rows = await qb.getRawMany();

    return rows.map((r) => ({
      id: Number(r.r_id),
      lat: Number(r.r_lat),
      lng: Number(r.r_lng),
      status: r.r_status as RequestStatus,
      mahallaName: r.r_mahalla_name,
      address: r.r_address,
      beforePhotoUrl: r.r_before_photo_url,
      createdAt: new Date(r.r_created_at),
      completedAt: r.r_completed_at ? new Date(r.r_completed_at) : null
    }));
  }

  async findAssignedToWorker(workerId: number): Promise<RequestEntity[]> {
    return this.requestRepo.find({
      where: {
        assignedWorkerId: workerId,
        status: In([RequestStatus.IN_PROGRESS, RequestStatus.NEW])
      },
      relations: ['district', 'mahalla'],
      order: { assignedAt: 'DESC' }
    });
  }

  async findCompletedByWorker(workerId: number): Promise<RequestEntity[]> {
    return this.requestRepo.find({
      where: {
        assignedWorkerId: workerId,
        status: In([RequestStatus.SUBMITTED, RequestStatus.COMPLETED])
      },
      relations: ['district', 'mahalla'],
      order: { updatedAt: 'DESC' }
    });
  }
}

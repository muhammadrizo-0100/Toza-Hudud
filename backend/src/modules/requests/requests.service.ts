import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, DataSource } from 'typeorm';
import { RequestEntity, RequestStatus, RequestSource } from '../../database/entities/request.entity';
import { NotificationEntity } from '../../database/entities/notification.entity';
import { WorkerEntity } from '../../database/entities/worker.entity';
import { JwtPayload } from '../auth/types/jwt-payload.type';
import { RealtimeService } from '../../common/realtime/realtime.service';
import { CreateRequestInput, RequestFilterParams, PaginatedRequestsResult, MapPointItem } from './requests.types';
export * from './requests.types';
import { findFilteredRequests, findMapPoints } from './requests-query.helper';
import {
  executeAssignWorker,
  executeSubmitWork,
  executeVerifyWork,
  executeRejectWork
} from './requests-workflow.helper';

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
    private readonly realtimeService: RealtimeService,
    private readonly dataSource: DataSource
  ) {}

  async findAll(filters: RequestFilterParams, user?: JwtPayload | null): Promise<PaginatedRequestsResult> {
    return findFilteredRequests(this.requestRepo, filters, user);
  }

  async findOne(id: number): Promise<RequestEntity> {
    const item = await this.requestRepo.findOne({
      where: { id },
      relations: ['district', 'mahalla', 'assignedWorker']
    });
    if (!item) throw new NotFoundException(`Murojaat #${id} topilmadi`);
    return item;
  }

  async create(input: CreateRequestInput, actorAdminId?: number): Promise<RequestEntity> {
    if (!input.beforePhotoUrl) {
      throw new BadRequestException('Chiqindining rasmi yuklanishi shart');
    }

    const { savedRequest, savedNotification } = await this.dataSource.transaction(async (manager) => {
      const request = manager.create(RequestEntity, {
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
      const saved = await manager.save(request);

      const notification = manager.create(NotificationEntity, {
        districtId: saved.districtId,
        recipientAdminId: null,
        requestId: saved.id,
        kind: 'created',
        title: `Yangi chiqindi murojaati #${saved.id}`,
        message: `${saved.mahallaName || 'Mahalla'} — ${saved.address || 'Manzil ko‘rsatilmagan'}`,
        status: RequestStatus.NEW,
        isRead: false
      });
      const savedNotif = await manager.save(notification);

      return { savedRequest: saved, savedNotification: savedNotif };
    });

    this.realtimeService.emitRequestCreated(savedRequest);
    this.realtimeService.emitNotification(savedNotification, actorAdminId);
    return savedRequest;
  }

  async assignWorker(requestId: number, workerId: number, actorAdminId?: number): Promise<RequestEntity> {
    const worker = await this.workerRepo.findOne({ where: { id: workerId } });
    if (!worker) throw new NotFoundException(`Xodim #${workerId} topilmadi`);

    const { saved, isReassignment, notifToEmit } = await executeAssignWorker(this.dataSource, requestId, worker);
    if (notifToEmit) this.realtimeService.emitNotification(notifToEmit, actorAdminId);
    this.realtimeService.emitRequestAssigned(saved, worker, isReassignment);
    return saved;
  }

  async submitWork(requestId: number, afterPhotoUrl: string, actorAdminId?: number): Promise<RequestEntity> {
    const { saved, savedNotif, worker, submittingActorId } = await executeSubmitWork(
      this.dataSource,
      requestId,
      afterPhotoUrl,
      actorAdminId
    );
    this.realtimeService.emitRequestSubmitted(saved, worker);
    this.realtimeService.emitNotification(savedNotif, submittingActorId);
    return saved;
  }

  async verifyWork(requestId: number, actorAdminId?: number): Promise<RequestEntity> {
    const { saved, worker, notifToEmit } = await executeVerifyWork(this.dataSource, requestId);
    if (notifToEmit) this.realtimeService.emitNotification(notifToEmit, actorAdminId);
    this.realtimeService.emitRequestCompleted(saved, worker);
    return saved;
  }

  async rejectWork(requestId: number, reason?: string, actorAdminId?: number): Promise<RequestEntity> {
    const cleanReason = (reason || '').trim();
    const { saved, worker, notifsToEmit } = await executeRejectWork(
      this.dataSource,
      requestId,
      cleanReason,
      actorAdminId
    );
    this.realtimeService.emitRequestRejected(saved, cleanReason, worker);
    for (const n of notifsToEmit) this.realtimeService.emitNotification(n, actorAdminId);
    return saved;
  }

  async getMapPoints(districtId?: number): Promise<MapPointItem[]> {
    return findMapPoints(this.requestRepo, districtId);
  }

  async findAssignedToWorker(workerId: number): Promise<RequestEntity[]> {
    return this.requestRepo.find({
      where: { assignedWorkerId: workerId, status: In([RequestStatus.IN_PROGRESS, RequestStatus.NEW]) },
      relations: ['district', 'mahalla'],
      order: { assignedAt: 'DESC' }
    });
  }

  async findCompletedByWorker(workerId: number): Promise<RequestEntity[]> {
    return this.requestRepo.find({
      where: { assignedWorkerId: workerId, status: In([RequestStatus.SUBMITTED, RequestStatus.COMPLETED]) },
      relations: ['district', 'mahalla'],
      order: { updatedAt: 'DESC' }
    });
  }
}

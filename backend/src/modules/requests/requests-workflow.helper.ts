import { DataSource } from 'typeorm';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { RequestEntity, RequestStatus } from '../../database/entities/request.entity';
import { NotificationEntity } from '../../database/entities/notification.entity';
import { WorkerEntity } from '../../database/entities/worker.entity';

export async function executeAssignWorker(
  dataSource: DataSource,
  requestId: number,
  worker: WorkerEntity
): Promise<{ saved: RequestEntity; isReassignment: boolean; notifToEmit: NotificationEntity | null }> {
  return dataSource.transaction(async (manager) => {
    const request = await manager.findOne(RequestEntity, { where: { id: requestId } });
    if (!request) throw new NotFoundException(`Murojaat #${requestId} topilmadi`);

    const isReassigned = request.status === RequestStatus.REJECTED || (!!request.assignedWorkerId && request.assignedWorkerId !== worker.id);
    request.assignedWorkerId = worker.id;
    request.assignedWorker = worker;
    request.status = RequestStatus.IN_PROGRESS;
    request.assignedAt = new Date();
    request.rejectionReason = null;

    const savedReq = await manager.save(request);
    let createdNotif: NotificationEntity | null = null;

    if (worker.adminId) {
      const notif = manager.create(NotificationEntity, {
        districtId: savedReq.districtId,
        recipientAdminId: worker.adminId,
        requestId: savedReq.id,
        kind: 'assignment',
        title: isReassigned ? `Qayta biriktirilgan topshiriq #${savedReq.id}` : `Yangi topshiriq biriktirildi #${savedReq.id}`,
        message: `${savedReq.mahallaName || 'Hudud'} — ${savedReq.address || 'Manzil ko‘rsatilmagan'}`,
        status: RequestStatus.IN_PROGRESS,
        isRead: false
      });
      createdNotif = await manager.save(notif);
    }

    return { saved: savedReq, isReassignment: isReassigned, notifToEmit: createdNotif };
  });
}

export async function executeSubmitWork(
  dataSource: DataSource,
  requestId: number,
  afterPhotoUrl: string,
  actorAdminId?: number
): Promise<{ saved: RequestEntity; savedNotif: NotificationEntity; worker: WorkerEntity | null; submittingActorId?: number }> {
  return dataSource.transaction(async (manager) => {
    const request = await manager.findOne(RequestEntity, { where: { id: requestId } });
    if (!request) throw new NotFoundException(`Murojaat #${requestId} topilmadi`);

    if (request.status === RequestStatus.COMPLETED) {
      throw new BadRequestException('Bu topshiriq allaqachon dispetcher tomonidan tasdiqlangan va yakunlangan!');
    }
    if (request.status === RequestStatus.SUBMITTED) {
      throw new BadRequestException('Bu topshiriq bo‘yicha hisobot allaqachon yuklangan va dispetcher tasdig‘i kutilmoqda!');
    }

    request.afterPhotoUrl = afterPhotoUrl;
    request.status = RequestStatus.SUBMITTED;
    request.submittedAt = new Date();
    const savedReq = await manager.save(request);

    let resolvedWorker: WorkerEntity | null = null;
    let resolvedActorId = actorAdminId;
    if (savedReq.assignedWorkerId) {
      resolvedWorker = await manager.findOne(WorkerEntity, { where: { id: savedReq.assignedWorkerId } });
      if (!resolvedActorId && resolvedWorker?.adminId) resolvedActorId = resolvedWorker.adminId;
    }

    const notif = manager.create(NotificationEntity, {
      districtId: savedReq.districtId,
      recipientAdminId: null,
      requestId: savedReq.id,
      kind: 'submitted',
      title: `Tozalash yakunlandi (Tasdiq kutilmoqda) #${savedReq.id}`,
      message: `${savedReq.mahallaName || 'Hudud'} tozalangani haqida xodim hisobot yukladi`,
      status: RequestStatus.SUBMITTED,
      isRead: false
    });
    const savedNotification = await manager.save(notif);

    return { saved: savedReq, savedNotif: savedNotification, worker: resolvedWorker, submittingActorId: resolvedActorId };
  });
}

export async function executeVerifyWork(
  dataSource: DataSource,
  requestId: number
): Promise<{ saved: RequestEntity; worker: WorkerEntity | null; notifToEmit: NotificationEntity | null }> {
  return dataSource.transaction(async (manager) => {
    const request = await manager.findOne(RequestEntity, { where: { id: requestId } });
    if (!request) throw new NotFoundException(`Murojaat #${requestId} topilmadi`);
    if (request.status !== RequestStatus.SUBMITTED) {
      throw new BadRequestException('Faqat xodim tozalash fotohisobotini yuklagan murojaatni qabul qilish mumkin');
    }

    request.status = RequestStatus.COMPLETED;
    request.completedAt = new Date();
    const savedReq = await manager.save(request);

    let resolvedWorker: WorkerEntity | null = null;
    let createdNotif: NotificationEntity | null = null;
    if (savedReq.assignedWorkerId) {
      resolvedWorker = await manager.findOne(WorkerEntity, { where: { id: savedReq.assignedWorkerId } });
      if (resolvedWorker?.adminId) {
        const notif = manager.create(NotificationEntity, {
          districtId: savedReq.districtId,
          recipientAdminId: resolvedWorker.adminId,
          requestId: savedReq.id,
          kind: 'completed',
          title: `Ish qabul qilindi #${savedReq.id}`,
          message: `${savedReq.mahallaName || 'Hudud'} bo‘yicha tozalash hisobotingiz tasdiqlandi`,
          status: RequestStatus.COMPLETED,
          isRead: false
        });
        createdNotif = await manager.save(notif);
      }
    }

    return { saved: savedReq, worker: resolvedWorker, notifToEmit: createdNotif };
  });
}

export async function executeRejectWork(
  dataSource: DataSource,
  requestId: number,
  cleanReason: string,
  actorAdminId?: number
): Promise<{ saved: RequestEntity; worker: WorkerEntity | null; notifsToEmit: NotificationEntity[] }> {
  return dataSource.transaction(async (manager) => {
    const request = await manager.findOne(RequestEntity, { where: { id: requestId } });
    if (!request) throw new NotFoundException(`Murojaat #${requestId} topilmadi`);

    request.status = RequestStatus.REJECTED;
    request.rejectionReason = cleanReason;
    const savedReq = await manager.save(request);

    let resolvedWorker: WorkerEntity | null = null;
    if (savedReq.assignedWorkerId) {
      resolvedWorker = await manager.findOne(WorkerEntity, { where: { id: savedReq.assignedWorkerId } });
    }

    const notifs: NotificationEntity[] = [];
    const notif = manager.create(NotificationEntity, {
      districtId: savedReq.districtId,
      recipientAdminId: null,
      requestId: savedReq.id,
      kind: 'rejected',
      title: `Topshiriq rad etildi #${savedReq.id}`,
      message: `Rad etish sababi: ${cleanReason}`,
      status: RequestStatus.REJECTED,
      isRead: false
    });
    notifs.push(await manager.save(notif));

    if (resolvedWorker?.adminId && resolvedWorker.adminId !== actorAdminId) {
      const workerNotif = manager.create(NotificationEntity, {
        districtId: savedReq.districtId,
        recipientAdminId: resolvedWorker.adminId,
        requestId: savedReq.id,
        kind: 'rejected',
        title: `Murojaat rad etildi #${savedReq.id}`,
        message: `Sabab: ${cleanReason}`,
        status: RequestStatus.REJECTED,
        isRead: false
      });
      notifs.push(await manager.save(workerNotif));
    }

    return { saved: savedReq, worker: resolvedWorker, notifsToEmit: notifs };
  });
}

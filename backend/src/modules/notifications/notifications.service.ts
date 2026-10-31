import { Injectable, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder, UpdateQueryBuilder, DeleteQueryBuilder } from 'typeorm';
import { NotificationEntity } from '../../database/entities/notification.entity';
import { JwtPayload } from '../auth/types/jwt-payload.type';
import { AdminRole } from '../../database/entities/admin.entity';
import { RealtimeService } from '../../common/realtime/realtime.service';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(NotificationEntity)
    private readonly notifRepo: Repository<NotificationEntity>,
    private readonly realtimeService: RealtimeService
  ) {}

  private applyUserScope(qb: SelectQueryBuilder<NotificationEntity>, user: JwtPayload): void {
    if (user.role === AdminRole.SUPERADMIN) {
      // SuperAdmin sees all broadcast notifications and notifications sent to them
      qb.where('(n.recipient_admin_id = :userId OR n.recipient_admin_id IS NULL)', { userId: user.id });
    } else if (user.role === AdminRole.INSPECTOR || user.role === AdminRole.DRIVER) {
      // Field executors only see notifications directed to them personally
      qb.where('n.recipient_admin_id = :userId', { userId: user.id });
    } else {
      // Dispatcher and Manager see broadcast notifications for their district + directed to them
      qb.where(
        '(n.recipient_admin_id = :userId OR (n.district_id = :districtId AND n.recipient_admin_id IS NULL))',
        { userId: user.id, districtId: user.districtId }
      );
    }
  }

  private applyUpdateScope(qb: any, user: JwtPayload): void {
    if (user.role === AdminRole.SUPERADMIN) {
      qb.where('(recipient_admin_id = :userId OR recipient_admin_id IS NULL)', { userId: user.id });
    } else if (user.role === AdminRole.INSPECTOR || user.role === AdminRole.DRIVER) {
      qb.where('recipient_admin_id = :userId', { userId: user.id });
    } else {
      qb.where(
        '(recipient_admin_id = :userId OR (district_id = :districtId AND recipient_admin_id IS NULL))',
        { userId: user.id, districtId: user.districtId }
      );
    }
  }

  async getUserNotifications(user: JwtPayload, limit = 30) {
    // 1. Fetch exact total unread count across ALL user notifications
    const unreadCountQb = this.notifRepo.createQueryBuilder('n');
    this.applyUserScope(unreadCountQb, user);
    unreadCountQb.andWhere('n.is_read = false');
    const unreadCount = await unreadCountQb.getCount();

    // 2. Fetch total count across ALL user notifications
    const totalCountQb = this.notifRepo.createQueryBuilder('n');
    this.applyUserScope(totalCountQb, user);
    const totalCount = await totalCountQb.getCount();

    // 3. Paginated items
    const itemsQb = this.notifRepo.createQueryBuilder('n');
    this.applyUserScope(itemsQb, user);
    itemsQb.orderBy('n.createdAt', 'DESC').take(limit);
    const items = await itemsQb.getMany();

    return {
      items: items.map((it) => ({
        id: String(it.id),
        requestId: it.requestId,
        kind: it.kind,
        title: it.title,
        message: it.message,
        status: it.status,
        districtId: it.districtId,
        recipientAdminId: it.recipientAdminId,
        isRead: it.isRead,
        createdAt: it.createdAt instanceof Date ? it.createdAt.toISOString() : String(it.createdAt)
      })),
      unreadCount,
      totalCount
    };
  }

  async markAsRead(notificationId: string, user?: JwtPayload): Promise<boolean> {
    await this.notifRepo.update({ id: notificationId }, { isRead: true });
    if (user?.id) {
      this.realtimeService.emitNotificationRead(user.id, notificationId);
    }
    return true;
  }

  async markAllAsRead(user: JwtPayload): Promise<boolean> {
    const qb = this.notifRepo.createQueryBuilder().update(NotificationEntity).set({ isRead: true });
    this.applyUpdateScope(qb, user);
    await qb.execute();
    if (user?.id) {
      this.realtimeService.emitNotificationReadAll(user.id);
    }
    return true;
  }

  async deleteNotification(notificationId: string): Promise<boolean> {
    await this.notifRepo.delete({ id: notificationId });
    return true;
  }

  async clearUserNotifications(user: JwtPayload): Promise<boolean> {
    const qb = this.notifRepo.createQueryBuilder().delete().from(NotificationEntity);
    this.applyUpdateScope(qb, user);
    await qb.execute();
    if (user?.id) {
      this.realtimeService.emitNotificationCleared(user.id);
    }
    return true;
  }
}

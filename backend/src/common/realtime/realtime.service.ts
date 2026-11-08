import { Injectable } from '@nestjs/common';
import { RealtimeGateway } from './realtime.gateway';
import { RequestEntity, NotificationEntity, WorkerEntity } from '../../database/entities';

export interface RequestAssignedEvent {
  request: RequestEntity;
  worker: WorkerEntity;
  isReassignment?: boolean;
}

export interface RequestCompletedEvent {
  request: RequestEntity;
  worker?: WorkerEntity | null;
}

export interface RequestSubmittedEvent {
  request: RequestEntity;
  worker?: WorkerEntity | null;
}

export interface RequestRejectedEvent {
  request: RequestEntity;
  reason: string;
  worker?: WorkerEntity | null;
}

@Injectable()
export class RealtimeService {
  private readonly assignedListeners: Array<(event: RequestAssignedEvent) => void | Promise<void>> = [];
  private readonly completedListeners: Array<(event: RequestCompletedEvent) => void | Promise<void>> = [];
  private readonly submittedListeners: Array<(event: RequestSubmittedEvent) => void | Promise<void>> = [];
  private readonly rejectedListeners: Array<(event: RequestRejectedEvent) => void | Promise<void>> = [];

  constructor(private readonly gateway: RealtimeGateway) {}

  onRequestAssigned(listener: (event: RequestAssignedEvent) => void | Promise<void>): void {
    this.assignedListeners.push(listener);
  }

  onRequestCompleted(listener: (event: RequestCompletedEvent) => void | Promise<void>): void {
    this.completedListeners.push(listener);
  }

  onRequestSubmitted(listener: (event: RequestSubmittedEvent) => void | Promise<void>): void {
    this.submittedListeners.push(listener);
  }

  onRequestRejected(listener: (event: RequestRejectedEvent) => void | Promise<void>): void {
    this.rejectedListeners.push(listener);
  }

  emitRequestCreated(request: RequestEntity): void {
    const payload = {
      id: request.id,
      districtId: request.districtId,
      status: request.status,
      mahallaName: request.mahallaName,
      createdAt: request.createdAt
    };

    // Broadcast to superadmins
    this.gateway.server.to('room:superadmin').emit('request.created', payload);
    // Broadcast to specific district room
    this.gateway.server.to(`room:district_${request.districtId}`).emit('request.created', payload);
  }

  emitRequestUpdated(request: RequestEntity): void {
    const payload = {
      id: request.id,
      districtId: request.districtId,
      status: request.status,
      assignedWorkerId: request.assignedWorkerId,
      updatedAt: request.updatedAt
    };

    this.gateway.server.to('room:superadmin').emit('request.updated', payload);
    if (request.districtId) {
      this.gateway.server.to(`room:district_${request.districtId}`).emit('request.updated', payload);
    }
    if (request.assignedWorker?.adminId) {
      this.gateway.server.to(`room:admin_${request.assignedWorker.adminId}`).emit('request.updated', payload);
    }
  }

  emitRequestAssigned(request: RequestEntity, worker: WorkerEntity, isReassignment = false): void {
    this.emitRequestUpdated(request);

    const assignedPayload = {
      id: request.id,
      districtId: request.districtId,
      status: request.status,
      assignedWorkerId: worker.id,
      workerName: worker.fullName,
      workerRole: worker.role,
      isReassignment,
      updatedAt: request.updatedAt
    };

    this.gateway.server.to('room:superadmin').emit('request.assigned', assignedPayload);
    if (request.districtId) {
      this.gateway.server.to(`room:district_${request.districtId}`).emit('request.assigned', assignedPayload);
    }
    if (worker.adminId) {
      this.gateway.server.to(`room:admin_${worker.adminId}`).emit('request.assigned', assignedPayload);
    }

    for (const listener of this.assignedListeners) {
      try {
        const res = listener({ request, worker, isReassignment });
        if (res instanceof Promise) {
          res.catch(() => {});
        }
      } catch (err) {}
    }
  }

  emitRequestSubmitted(request: RequestEntity, worker?: WorkerEntity | null): void {
    this.emitRequestUpdated(request);

    const payload = {
      id: request.id,
      districtId: request.districtId,
      status: request.status,
      assignedWorkerId: request.assignedWorkerId,
      updatedAt: request.updatedAt
    };

    this.gateway.server.to('room:superadmin').emit('request.submitted', payload);
    if (request.districtId) {
      this.gateway.server.to(`room:district_${request.districtId}`).emit('request.submitted', payload);
    }
    if (worker?.adminId) {
      this.gateway.server.to(`room:admin_${worker.adminId}`).emit('request.submitted', payload);
    }

    for (const listener of this.submittedListeners) {
      try {
        const res = listener({ request, worker });
        if (res instanceof Promise) {
          res.catch(() => {});
        }
      } catch (err) {}
    }
  }

  emitRequestCompleted(request: RequestEntity, worker?: WorkerEntity | null): void {
    this.emitRequestUpdated(request);

    const payload = {
      id: request.id,
      districtId: request.districtId,
      status: request.status,
      assignedWorkerId: request.assignedWorkerId,
      updatedAt: request.updatedAt
    };

    this.gateway.server.to('room:superadmin').emit('request.completed', payload);
    if (request.districtId) {
      this.gateway.server.to(`room:district_${request.districtId}`).emit('request.completed', payload);
    }
    if (worker?.adminId) {
      this.gateway.server.to(`room:admin_${worker.adminId}`).emit('request.completed', payload);
    }

    for (const listener of this.completedListeners) {
      try {
        const res = listener({ request, worker });
        if (res instanceof Promise) {
          res.catch(() => {});
        }
      } catch (err) {}
    }
  }

  emitRequestRejected(request: RequestEntity, reason: string, worker?: WorkerEntity | null): void {
    this.emitRequestUpdated(request);

    const payload = {
      id: request.id,
      districtId: request.districtId,
      status: request.status,
      assignedWorkerId: request.assignedWorkerId,
      reason,
      updatedAt: request.updatedAt
    };

    this.gateway.server.to('room:superadmin').emit('request.rejected', payload);
    if (request.districtId) {
      this.gateway.server.to(`room:district_${request.districtId}`).emit('request.rejected', payload);
    }
    if (worker?.adminId) {
      this.gateway.server.to(`room:admin_${worker.adminId}`).emit('request.rejected', payload);
    }

    for (const listener of this.rejectedListeners) {
      try {
        const res = listener({ request, reason, worker });
        if (res instanceof Promise) {
          res.catch(() => {});
        }
      } catch (err) {}
    }
  }

  emitNotification(notification: NotificationEntity, actorAdminId?: number | null): void {
    const payload = {
      id: String(notification.id),
      requestId: notification.requestId,
      kind: notification.kind,
      title: notification.title,
      message: notification.message,
      status: notification.status,
      districtId: notification.districtId,
      recipientAdminId: notification.recipientAdminId,
      createdAt: notification.createdAt instanceof Date ? notification.createdAt.toISOString() : notification.createdAt,
      isRead: notification.isRead,
      actorAdminId: actorAdminId || null
    };

    if (notification.recipientAdminId) {
      // 1. Direct personal notification to the recipient admin
      this.gateway.server.to(`room:admin_${notification.recipientAdminId}`).emit('notification.new', payload);
    } else {
      // 2. Broadcast to SuperAdmins
      this.gateway.server.to('room:superadmin').emit('notification.new', payload);

      // 3. Broadcast to the relevant district room (managers and dispatchers)
      if (notification.districtId) {
        this.gateway.server.to(`room:district_${notification.districtId}`).emit('notification.new', payload);
      }
    }
  }

  emitNotificationRead(adminId: number, notificationId: string): void {
    this.gateway.server.to(`room:admin_${adminId}`).emit('notification.read', { id: String(notificationId) });
  }

  emitNotificationReadAll(adminId: number): void {
    this.gateway.server.to(`room:admin_${adminId}`).emit('notification.readAll', {});
  }

  emitNotificationCleared(adminId: number): void {
    this.gateway.server.to(`room:admin_${adminId}`).emit('notification.cleared', {});
  }
}

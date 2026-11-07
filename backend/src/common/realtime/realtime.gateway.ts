import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

export interface SubscriptionPayload {
  role?: string;
  districtId?: number | null;
  adminId?: number | null;
}

@WebSocketGateway({
  cors: {
    origin: '*',
    credentials: true
  }
})
export class RealtimeGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(RealtimeGateway.name);

  handleConnection(client: Socket): void {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket): void {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('subscribe')
  handleSubscribe(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: SubscriptionPayload
  ): { status: string } {
    const role = String(data?.role || '').toLowerCase();
    const districtId = data?.districtId ? Number(data.districtId) : null;
    const adminId = data?.adminId ? Number(data.adminId) : null;

    if (role === 'superadmin') {
      client.join('room:superadmin');
    }

    if (districtId) {
      client.join(`room:district_${districtId}`);
    }

    if (adminId) {
      client.join(`room:admin_${adminId}`);
    }

    this.logger.log(`Client ${client.id} subscribed: role=${role}, districtId=${districtId}, adminId=${adminId}`);
    return { status: 'subscribed' };
  }

  @SubscribeMessage('ping')
  handlePing(): { pong: number } {
    return { pong: Date.now() };
  }
}

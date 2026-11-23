import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BotService } from './bot.service';
import { BotNotificationsService } from './bot-notifications.service';
import { PublicBotService } from './public-bot.service';
import { WorkerBotService } from './worker-bot.service';
import { WorkerAuthService } from './worker-auth.service';
import { RequestsModule } from '../requests/requests.module';
import { DistrictsModule } from '../districts/districts.module';
import { MahallasModule } from '../mahallas/mahallas.module';
import { WorkersModule } from '../workers/workers.module';
import { TunnelModule } from '../tunnel/tunnel.module';
import { AdminEntity } from '../../database/entities/admin.entity';
import { WorkerEntity } from '../../database/entities/worker.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([AdminEntity, WorkerEntity]),
    RequestsModule,
    DistrictsModule,
    MahallasModule,
    WorkersModule,
    TunnelModule
  ],
  providers: [
    BotService,
    BotNotificationsService,
    PublicBotService,
    WorkerBotService,
    WorkerAuthService
  ],
  exports: [BotService]
})
export class BotModule {}

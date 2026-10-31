import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RequestEntity } from '../../database/entities/request.entity';
import { NotificationEntity } from '../../database/entities/notification.entity';
import { WorkerEntity } from '../../database/entities/worker.entity';
import { RequestsService } from './requests.service';
import { RequestsController } from './requests.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([RequestEntity, NotificationEntity, WorkerEntity]),
    AuthModule
  ],
  controllers: [RequestsController],
  providers: [RequestsService],
  exports: [RequestsService]
})
export class RequestsModule {}

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BotService } from './bot.service';
import { RequestsModule } from '../requests/requests.module';
import { DistrictsModule } from '../districts/districts.module';
import { MahallasModule } from '../mahallas/mahallas.module';
import { WorkersModule } from '../workers/workers.module';
import { AdminEntity } from '../../database/entities/admin.entity';
import { WorkerEntity } from '../../database/entities/worker.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([AdminEntity, WorkerEntity]),
    RequestsModule,
    DistrictsModule,
    MahallasModule,
    WorkersModule
  ],
  providers: [BotService],
  exports: [BotService]
})
export class BotModule {}

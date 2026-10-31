import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RequestEntity } from '../../database/entities/request.entity';
import { DistrictEntity } from '../../database/entities/district.entity';
import { AdminEntity } from '../../database/entities/admin.entity';
import { MahallaEntity } from '../../database/entities/mahalla.entity';
import { WorkerEntity } from '../../database/entities/worker.entity';
import { StatsService } from './stats.service';
import { StatsController } from './stats.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      RequestEntity,
      DistrictEntity,
      AdminEntity,
      MahallaEntity,
      WorkerEntity
    ]),
    AuthModule
  ],
  controllers: [StatsController],
  providers: [StatsService],
  exports: [StatsService]
})
export class StatsModule {}


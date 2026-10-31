import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WorkerEntity } from '../../database/entities/worker.entity';
import { WorkersService } from './workers.service';
import { WorkersController } from './workers.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([WorkerEntity]), AuthModule],
  controllers: [WorkersController],
  providers: [WorkersService],
  exports: [WorkersService]
})
export class WorkersModule {}

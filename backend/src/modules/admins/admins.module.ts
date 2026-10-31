import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminEntity } from '../../database/entities/admin.entity';
import { DistrictEntity } from '../../database/entities/district.entity';
import { AdminsController } from './admins.controller';
import { AdminsService } from './admins.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([AdminEntity, DistrictEntity]),
    AuthModule
  ],
  controllers: [AdminsController],
  providers: [AdminsService],
  exports: [AdminsService]
})
export class AdminsModule {}

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DistrictEntity } from '../../database/entities/district.entity';
import { DistrictsService } from './districts.service';
import { DistrictsController } from './districts.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([DistrictEntity]), AuthModule],
  controllers: [DistrictsController],
  providers: [DistrictsService],
  exports: [DistrictsService]
})
export class DistrictsModule {}

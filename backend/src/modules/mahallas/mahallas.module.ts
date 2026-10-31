import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MahallaEntity } from '../../database/entities/mahalla.entity';
import { DistrictEntity } from '../../database/entities/district.entity';
import { MahallasService } from './mahallas.service';
import { MahallasController } from './mahallas.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([MahallaEntity, DistrictEntity]),
    AuthModule
  ],
  controllers: [MahallasController],
  providers: [MahallasService],
  exports: [MahallasService]
})
export class MahallasModule {}

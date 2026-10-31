import { Module } from '@nestjs/common';
import { PublicApiController } from './public-api.controller';
import { RequestsModule } from '../requests/requests.module';
import { DistrictsModule } from '../districts/districts.module';
import { MahallasModule } from '../mahallas/mahallas.module';

@Module({
  imports: [RequestsModule, DistrictsModule, MahallasModule],
  controllers: [PublicApiController]
})
export class PublicApiModule {}

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RequestEntity } from '../../database/entities/request.entity';
import { DistrictEntity } from '../../database/entities/district.entity';
import { AdminEntity } from '../../database/entities/admin.entity';
import { MahallaEntity } from '../../database/entities/mahalla.entity';
import { WorkerEntity } from '../../database/entities/worker.entity';
import { JwtPayload } from '../auth/types/jwt-payload.type';
import { computeSystemInsights } from './system-insights.helper';
import { computeDashboardStats } from './dashboard-stats.helper';
import { computeAccountStats } from './account-stats.helper';

@Injectable()
export class StatsService {
  constructor(
    @InjectRepository(RequestEntity)
    private readonly requestRepo: Repository<RequestEntity>,
    @InjectRepository(DistrictEntity)
    private readonly districtRepo: Repository<DistrictEntity>,
    @InjectRepository(AdminEntity)
    private readonly adminRepo: Repository<AdminEntity>,
    @InjectRepository(MahallaEntity)
    private readonly mahallaRepo: Repository<MahallaEntity>,
    @InjectRepository(WorkerEntity)
    private readonly workerRepo: Repository<WorkerEntity>
  ) {}

  async getSystemInsights(
    user?: JwtPayload | null,
    selectedDistrictId?: number,
    startDate?: string,
    endDate?: string
  ) {
    return computeSystemInsights(
      this.requestRepo,
      this.districtRepo,
      this.adminRepo,
      this.mahallaRepo,
      this.workerRepo,
      user,
      selectedDistrictId,
      startDate,
      endDate
    );
  }

  async getDashboardStats(
    user?: JwtPayload | null,
    selectedDistrictId?: number,
    startDate?: string,
    endDate?: string
  ) {
    return computeDashboardStats(
      this.requestRepo,
      this.districtRepo,
      user,
      selectedDistrictId,
      startDate,
      endDate
    );
  }

  async getMyAccountStats(
    user: JwtPayload,
    targetAdminId?: number,
    targetDistrictId?: number
  ) {
    return computeAccountStats(
      this.adminRepo,
      this.workerRepo,
      this.requestRepo,
      user,
      targetAdminId,
      targetDistrictId
    );
  }
}

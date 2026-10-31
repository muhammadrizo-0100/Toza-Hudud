import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WorkerEntity } from '../../database/entities/worker.entity';

export interface CreateWorkerDto {
  districtId: number;
  fullName: string;
  phone: string;
  role?: string;
  vehicleNumber?: string;
  telegramId?: string;
}

export interface UpdateWorkerDto {
  fullName?: string;
  phone?: string;
  role?: string;
  vehicleNumber?: string;
  telegramId?: string;
  isActive?: boolean;
}

@Injectable()
export class WorkersService {
  constructor(
    @InjectRepository(WorkerEntity)
    private readonly workerRepo: Repository<WorkerEntity>
  ) {}

  async findAll(districtId?: number): Promise<WorkerEntity[]> {
    if (districtId) {
      return this.workerRepo.find({
        where: { districtId, isActive: true },
        order: { fullName: 'ASC' }
      });
    }

    return this.workerRepo.find({
      where: { isActive: true },
      order: { fullName: 'ASC' }
    });
  }

  async findOne(id: number): Promise<WorkerEntity> {
    const worker = await this.workerRepo.findOne({
      where: { id },
      relations: ['district']
    });

    if (!worker) {
      throw new NotFoundException(`Xodim #${id} topilmadi`);
    }

    return worker;
  }

  async findByPhone(phone: string): Promise<WorkerEntity | null> {
    const cleanPhone = phone.replace(/\D/g, '');
    return this.workerRepo
      .createQueryBuilder('w')
      .where("REGEXP_REPLACE(w.phone, '\\D', '', 'g') = :phone", { phone: cleanPhone })
      .andWhere('w.isActive = true')
      .getOne();
  }

  async findByTelegramId(telegramId: string): Promise<WorkerEntity | null> {
    return this.workerRepo.findOne({
      where: { telegramId: String(telegramId), isActive: true },
      relations: ['district']
    });
  }

  async setTelegramId(workerId: number, telegramId: string): Promise<WorkerEntity> {
    const worker = await this.findOne(workerId);
    worker.telegramId = String(telegramId);
    return this.workerRepo.save(worker);
  }

  async create(dto: CreateWorkerDto): Promise<WorkerEntity> {
    const entity = this.workerRepo.create({
      districtId: dto.districtId,
      fullName: dto.fullName.trim(),
      phone: dto.phone.trim(),
      role: dto.role || 'Driver',
      vehicleNumber: dto.vehicleNumber?.trim() || null,
      telegramId: dto.telegramId || null,
      isActive: true
    });

    return this.workerRepo.save(entity);
  }

  async update(id: number, dto: UpdateWorkerDto): Promise<WorkerEntity> {
    const worker = await this.findOne(id);
    Object.assign(worker, dto);
    return this.workerRepo.save(worker);
  }

  async delete(id: number): Promise<{ success: boolean }> {
    const worker = await this.findOne(id);
    worker.isActive = false;
    await this.workerRepo.save(worker);
    return { success: true };
  }
}

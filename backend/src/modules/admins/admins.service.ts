import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
  OnModuleInit
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { AdminEntity, AdminRole } from '../../database/entities/admin.entity';
import { DistrictEntity } from '../../database/entities/district.entity';
import { JwtPayload } from '../auth/types/jwt-payload.type';
import { CreateAdminDto } from './dto/create-admin.dto';
import { UpdateAdminDto } from './dto/update-admin.dto';

export type SanitizedAdmin = Omit<AdminEntity, 'passwordHash'>;

@Injectable()
export class AdminsService implements OnModuleInit {
  private readonly logger = new Logger(AdminsService.name);

  constructor(
    @InjectRepository(AdminEntity)
    private readonly adminRepo: Repository<AdminEntity>,
    @InjectRepository(DistrictEntity)
    private readonly districtRepo: Repository<DistrictEntity>
  ) {}

  async onModuleInit(): Promise<void> {
    // Demo seed disabled for clean testing from 0
  }

  async seedDistrictManagers(): Promise<void> {
    const districts = await this.districtRepo.find();
    if (districts.length === 0) return;

    for (const d of districts) {
      const code = d.code.toLowerCase().replace(/[^a-z0-9]/g, '');
      const defaultUsername = `${code}_admin`;
      const exists = await this.adminRepo.findOne({
        where: { username: defaultUsername }
      });

      if (!exists) {
        const passwordHash = await bcrypt.hash('admin123', 10);
        const manager = this.adminRepo.create({
          username: defaultUsername,
          passwordHash,
          fullName: `${d.name} Tozalik Bo'limi Boshlig'i`,
          phone: '+998901234567',
          jobTitle: `${d.name} sanitariya-tozalash rahbari`,
          role: AdminRole.MANAGER,
          districtId: d.id,
          isActive: true
        });
        await this.adminRepo.save(manager);
        this.logger.log(`Default Manager created for ${d.name}: ${defaultUsername} / admin123`);
      }
    }
  }

  private sanitize(admin: AdminEntity): SanitizedAdmin {
    const { passwordHash: _hash, ...rest } = admin;
    return rest;
  }

  async findAll(requester: JwtPayload, districtId?: number): Promise<SanitizedAdmin[]> {
    const qb = this.adminRepo
      .createQueryBuilder('a')
      .leftJoinAndSelect('a.district', 'd')
      .orderBy('a.id', 'ASC');

    if (requester.role === AdminRole.MANAGER) {
      if (!requester.districtId) {
        throw new ForbiddenException('Menejer tumaniga biriktirilmagan');
      }
      qb.andWhere('a.district_id = :dId', { dId: requester.districtId });
    } else if (districtId) {
      qb.andWhere('a.district_id = :dId', { dId: districtId });
    }

    const admins = await qb.getMany();
    return admins.map((a) => this.sanitize(a));
  }

  async findOne(id: number, requester: JwtPayload): Promise<SanitizedAdmin> {
    const admin = await this.adminRepo.findOne({
      where: { id },
      relations: ['district']
    });

    if (!admin) {
      throw new NotFoundException(`Xodim topilmadi (ID: ${id})`);
    }

    if (requester.role === AdminRole.MANAGER && admin.districtId !== requester.districtId) {
      throw new ForbiddenException('Boshqa tuman xodimini ko‘rish huquqi yo‘q');
    }

    return this.sanitize(admin);
  }

  async create(dto: CreateAdminDto, requester: JwtPayload): Promise<SanitizedAdmin> {
    const normalizedUsername = dto.username.trim().toLowerCase();
    if (!normalizedUsername) {
      throw new BadRequestException('Foydalanuvchi nomi kiritilishi shart');
    }

    if (!dto.password || dto.password.length < 6) {
      throw new BadRequestException('Parol kamida 6 ta belgidan iborat bo‘lishi kerak');
    }

    if (!dto.fullName || !dto.fullName.trim()) {
      throw new BadRequestException('F.I.Sh. kiritilishi shart');
    }

    // Role restrictions
    if (requester.role === AdminRole.MANAGER) {
      if (dto.role === AdminRole.SUPERADMIN || dto.role === AdminRole.MANAGER) {
        throw new ForbiddenException('Menejer faqat dispetcher yoki o‘z tuman xodimlarini qo‘sha oladi');
      }
      dto.districtId = requester.districtId;
    }

    // District requirement
    if (dto.role !== AdminRole.SUPERADMIN && !dto.districtId) {
      throw new BadRequestException('Tuman rahbari yoki dispetcher uchun tuman tanlanishi shart');
    }

    const exists = await this.adminRepo.findOne({
      where: { username: normalizedUsername }
    });

    if (exists) {
      throw new BadRequestException('Bu login bilan allaqachon xodim mavjud');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const newAdmin = this.adminRepo.create({
      username: normalizedUsername,
      passwordHash,
      fullName: dto.fullName.trim(),
      phone: dto.phone?.trim() || null,
      jobTitle: dto.jobTitle?.trim() || null,
      role: dto.role,
      districtId: dto.role === AdminRole.SUPERADMIN ? null : dto.districtId,
      isActive: true
    });

    const saved = await this.adminRepo.save(newAdmin);
    return this.findOne(saved.id, requester);
  }

  async update(id: number, dto: UpdateAdminDto, requester: JwtPayload): Promise<SanitizedAdmin> {
    const admin = await this.adminRepo.findOne({ where: { id } });
    if (!admin) {
      throw new NotFoundException(`Xodim topilmadi (ID: ${id})`);
    }

    if (requester.role === AdminRole.MANAGER) {
      if (admin.districtId !== requester.districtId) {
        throw new ForbiddenException('Boshqa tuman xodimini tahrirlash huquqi yo‘q');
      }
      if (dto.role && dto.role !== admin.role) {
        throw new ForbiddenException('Rolni o‘zgartirish huquqi faqat SuperAdminga berilgan');
      }
    }

    if (dto.fullName !== undefined) {
      admin.fullName = dto.fullName.trim();
    }
    if (dto.phone !== undefined) {
      admin.phone = dto.phone.trim() || null;
    }
    if (dto.jobTitle !== undefined) {
      admin.jobTitle = dto.jobTitle.trim() || null;
    }
    if (dto.role !== undefined && requester.role === AdminRole.SUPERADMIN) {
      admin.role = dto.role;
    }
    if (dto.districtId !== undefined && requester.role === AdminRole.SUPERADMIN) {
      admin.districtId = admin.role === AdminRole.SUPERADMIN ? null : dto.districtId;
    }
    if (dto.isActive !== undefined) {
      admin.isActive = dto.isActive;
    }
    if (dto.password && dto.password.trim()) {
      if (dto.password.trim().length < 6) {
        throw new BadRequestException('Yangi parol kamida 6 ta belgidan iborat bo‘lishi kerak');
      }
      admin.passwordHash = await bcrypt.hash(dto.password.trim(), 10);
    }

    await this.adminRepo.save(admin);
    return this.findOne(admin.id, requester);
  }

  async delete(id: number, requester: JwtPayload): Promise<{ success: boolean; message: string }> {
    if (requester.id === id) {
      throw new BadRequestException('O‘z hisobingizni o‘chira olmaysiz');
    }

    const admin = await this.adminRepo.findOne({ where: { id } });
    if (!admin) {
      throw new NotFoundException(`Xodim topilmadi (ID: ${id})`);
    }

    if (requester.role === AdminRole.MANAGER && admin.districtId !== requester.districtId) {
      throw new ForbiddenException('Boshqa tuman xodimini o‘chirish huquqi yo‘q');
    }

    // Delete employee record completely
    await this.adminRepo.delete(id);

    return { success: true, message: 'Xodim tizimdan muvaffaqiyatli o‘chirildi' };
  }
}

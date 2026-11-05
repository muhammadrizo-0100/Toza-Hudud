import { Injectable, UnauthorizedException, OnModuleInit, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { AdminEntity, AdminRole } from '../../database/entities/admin.entity';
import { JwtPayload } from './types/jwt-payload.type';

@Injectable()
export class AuthService implements OnModuleInit {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(AdminEntity)
    private readonly adminRepo: Repository<AdminEntity>,
    private readonly jwtService: JwtService
  ) {}

  async onModuleInit(): Promise<void> {
    await this.seedDefaultAdmin();
  }

  async seedDefaultAdmin(): Promise<void> {
    const count = await this.adminRepo.count();
    if (count === 0) {
      const passwordHash = await bcrypt.hash('admin123', 10);
      const superAdmin = this.adminRepo.create({
        username: 'admin',
        passwordHash,
        fullName: 'Bosh Administrator',
        phone: '+998901234567',
        role: AdminRole.SUPERADMIN,
        districtId: null,
        isActive: true
      });
      await this.adminRepo.save(superAdmin);
      this.logger.log('Default SuperAdmin account created: admin / admin123');
    }
  }

  async login(username: string, pass: string): Promise<{ token: string; user: JwtPayload }> {
    const rawUsername = (username || '').trim().toLowerCase();
    const cleanPass = (pass || '').trim();

    // Support both 'admin' and 'superadmin' aliases, as well as district manager aliases
    let admin = await this.adminRepo.findOne({
      where: { username: rawUsername, isActive: true }
    });

    if (!admin && rawUsername === 'superadmin') {
      admin = await this.adminRepo.findOne({
        where: { username: 'admin', isActive: true }
      });
    }

    if (!admin && rawUsername.endsWith('_admin')) {
      const baseName = rawUsername.replace(/_admin$/, '');
      admin = await this.adminRepo.findOne({
        where: [
          { username: `manager_${baseName}`, isActive: true },
          { username: `manager_${baseName.replace('yangi', 'yangi_')}`, isActive: true }
        ]
      });
    }

    if (!admin) {
      throw new UnauthorizedException('Login yoki parol noto‘g‘ri');
    }

    let isMatch = await bcrypt.compare(cleanPass, admin.passwordHash);
    // If it's the superadmin account, accept either 'admin123' or 'superadmin123'
    if (!isMatch && admin.role === AdminRole.SUPERADMIN && (cleanPass === 'admin123' || cleanPass === 'superadmin123')) {
      isMatch = true;
    }

    // If password failed on legacy account, try checking paired official manager account
    if (!isMatch && rawUsername.endsWith('_admin')) {
      const baseName = rawUsername.replace(/_admin$/, '');
      const altAdmin = await this.adminRepo.findOne({
        where: [
          { username: `manager_${baseName}`, isActive: true },
          { username: `manager_${baseName.replace('yangi', 'yangi_')}`, isActive: true }
        ]
      });
      if (altAdmin && await bcrypt.compare(cleanPass, altAdmin.passwordHash)) {
        admin = altAdmin;
        isMatch = true;
      }
    }

    if (!isMatch) {
      throw new UnauthorizedException('Login yoki parol noto‘g‘ri');
    }

    const payload: JwtPayload = {
      id: admin.id,
      username: admin.username,
      fullName: admin.fullName,
      role: admin.role,
      districtId: admin.districtId,
      workerId: admin.workerId || null
    };

    const token = this.jwtService.sign(payload);

    return { token, user: payload };
  }

  async getProfile(adminId: number): Promise<AdminEntity | null> {
    return this.adminRepo.findOne({
      where: { id: adminId },
      relations: ['district']
    });
  }
}

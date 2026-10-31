import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index
} from 'typeorm';
import { DistrictEntity } from './district.entity';

export enum AdminRole {
  SUPERADMIN = 'SuperAdmin',
  MANAGER = 'Manager',
  DISPATCHER = 'Dispatcher',
  INSPECTOR = 'Inspector',
  DRIVER = 'Driver'
}

@Entity('admins')
export class AdminEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 64, unique: true })
  @Index()
  username!: string;

  @Column({ name: 'password_hash', type: 'varchar', length: 255 })
  passwordHash!: string;

  @Column({ name: 'full_name', type: 'varchar', length: 128 })
  fullName!: string;

  @Column({ type: 'varchar', length: 32, nullable: true })
  phone!: string | null;

  @Column({ name: 'telegram_id', type: 'varchar', length: 64, nullable: true })
  @Index()
  telegramId!: string | null;

  @Column({ name: 'job_title', type: 'varchar', length: 128, nullable: true })
  jobTitle!: string | null;

  @Column({
    type: 'enum',
    enum: AdminRole,
    default: AdminRole.DISPATCHER
  })
  role!: AdminRole;

  @Column({ name: 'district_id', type: 'int', nullable: true })
  districtId!: number | null;

  @Column({ name: 'worker_id', type: 'int', nullable: true })
  workerId!: number | null;

  @ManyToOne(() => DistrictEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'district_id' })
  district!: DistrictEntity | null;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}

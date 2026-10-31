import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
  Index
} from 'typeorm';
import { DistrictEntity } from './district.entity';
import { RequestEntity } from './request.entity';

@Entity('workers')
export class WorkerEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'district_id', type: 'int' })
  districtId!: number;

  @ManyToOne(() => DistrictEntity, (d) => d.workers, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'district_id' })
  district!: DistrictEntity;

  @Column({ name: 'full_name', type: 'varchar', length: 128 })
  fullName!: string;

  @Column({ type: 'varchar', length: 32, unique: true })
  @Index()
  phone!: string;

  @Column({ name: 'telegram_id', type: 'varchar', length: 64, nullable: true })
  @Index()
  telegramId!: string | null;

  @Column({ name: 'vehicle_number', type: 'varchar', length: 32, nullable: true })
  vehicleNumber!: string | null;

  @Column({ name: 'admin_id', type: 'int', nullable: true })
  adminId!: number | null;

  @Column({ type: 'varchar', length: 32, default: 'Driver' })
  role!: string;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;

  @OneToMany(() => RequestEntity, (r) => r.assignedWorker)
  assignedRequests!: RequestEntity[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}

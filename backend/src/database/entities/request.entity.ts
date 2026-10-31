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
import { MahallaEntity } from './mahalla.entity';
import { WorkerEntity } from './worker.entity';

export enum RequestStatus {
  NEW = 'new',
  IN_PROGRESS = 'in_progress',
  SUBMITTED = 'submitted',
  COMPLETED = 'completed',
  REJECTED = 'rejected'
}

export enum RequestSource {
  TELEGRAM = 'telegram',
  WEB_PORTAL = 'web_portal'
}

@Entity('requests')
@Index(['districtId', 'status', 'createdAt'])
export class RequestEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'district_id', type: 'int' })
  districtId!: number;

  @ManyToOne(() => DistrictEntity, (d) => d.requests, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'district_id' })
  district!: DistrictEntity;

  @Column({ name: 'mahalla_id', type: 'int', nullable: true })
  mahallaId!: number | null;

  @ManyToOne(() => MahallaEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'mahalla_id' })
  mahalla!: MahallaEntity | null;

  @Column({ name: 'mahalla_name', type: 'varchar', length: 128, nullable: true })
  mahallaName!: string | null;

  @Column({
    type: 'enum',
    enum: RequestSource,
    default: RequestSource.TELEGRAM
  })
  source!: RequestSource;

  @Column({ name: 'citizen_phone', type: 'varchar', length: 32, nullable: true })
  citizenPhone!: string | null;

  @Column({ name: 'citizen_telegram_id', type: 'varchar', length: 64, nullable: true })
  citizenTelegramId!: string | null;

  @Column({ name: 'citizen_full_name', type: 'varchar', length: 128, nullable: true })
  citizenFullName!: string | null;

  @Column({ name: 'before_photo_url', type: 'varchar', length: 500 })
  beforePhotoUrl!: string;

  @Column({ name: 'after_photo_url', type: 'varchar', length: 500, nullable: true })
  afterPhotoUrl!: string | null;

  @Column({ name: 'waste_type', type: 'varchar', length: 64, nullable: true, default: 'maishiy' })
  wasteType!: string | null;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  lat!: number | null;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  lng!: number | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  address!: string | null;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({
    type: 'enum',
    enum: RequestStatus,
    default: RequestStatus.NEW
  })
  @Index()
  status!: RequestStatus;

  @Column({ name: 'assigned_worker_id', type: 'int', nullable: true })
  assignedWorkerId!: number | null;

  @ManyToOne(() => WorkerEntity, (w) => w.assignedRequests, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'assigned_worker_id' })
  assignedWorker!: WorkerEntity | null;

  @Column({ name: 'assigned_at', type: 'timestamptz', nullable: true })
  assignedAt!: Date | null;

  @Column({ name: 'submitted_at', type: 'timestamptz', nullable: true })
  submittedAt!: Date | null;

  @Column({ name: 'completed_at', type: 'timestamptz', nullable: true })
  completedAt!: Date | null;

  @Column({ name: 'rejection_reason', type: 'varchar', length: 500, nullable: true })
  rejectionReason!: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  @Index()
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}

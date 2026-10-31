import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany
} from 'typeorm';
import { MahallaEntity } from './mahalla.entity';
import { WorkerEntity } from './worker.entity';
import { RequestEntity } from './request.entity';

@Entity('districts')
export class DistrictEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 128, unique: true })
  name!: string;

  @Column({ type: 'varchar', length: 64, unique: true })
  code!: string;

  @Column({ name: 'center_lat', type: 'decimal', precision: 10, scale: 7, default: 41.0000000 })
  centerLat!: number;

  @Column({ name: 'center_lng', type: 'decimal', precision: 10, scale: 7, default: 71.6000000 })
  centerLng!: number;

  @Column({ type: 'jsonb', nullable: true })
  polygon!: [number, number][] | null;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;

  @OneToMany(() => MahallaEntity, (m) => m.district)
  mahallas!: MahallaEntity[];

  @OneToMany(() => WorkerEntity, (w) => w.district)
  workers!: WorkerEntity[];

  @OneToMany(() => RequestEntity, (r) => r.district)
  requests!: RequestEntity[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}

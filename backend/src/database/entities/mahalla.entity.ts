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

@Entity('mahallas')
@Index(['districtId', 'name'])
export class MahallaEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'district_id', type: 'int' })
  districtId!: number;

  @ManyToOne(() => DistrictEntity, (d) => d.mahallas, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'district_id' })
  district!: DistrictEntity;

  @Column({ type: 'varchar', length: 128 })
  name!: string;

  @Column({ name: 'center_lat', type: 'decimal', precision: 10, scale: 7, nullable: true })
  centerLat!: number | null;

  @Column({ name: 'center_lng', type: 'decimal', precision: 10, scale: 7, nullable: true })
  centerLng!: number | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}

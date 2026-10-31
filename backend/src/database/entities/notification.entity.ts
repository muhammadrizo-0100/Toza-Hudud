import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index
} from 'typeorm';

@Entity('notifications')
@Index(['recipientAdminId', 'createdAt'])
@Index(['districtId', 'createdAt'])
export class NotificationEntity {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id!: string;

  @Column({ name: 'recipient_admin_id', type: 'int', nullable: true })
  recipientAdminId!: number | null;

  @Column({ name: 'district_id', type: 'int', nullable: true })
  districtId!: number | null;

  @Column({ name: 'request_id', type: 'int' })
  requestId!: number;

  @Column({ type: 'varchar', length: 32 })
  kind!: string;

  @Column({ type: 'varchar', length: 255 })
  title!: string;

  @Column({ type: 'varchar', length: 500 })
  message!: string;

  @Column({ type: 'varchar', length: 64 })
  status!: string;

  @Column({ name: 'is_read', type: 'boolean', default: false })
  isRead!: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}

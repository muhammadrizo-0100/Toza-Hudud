import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import {
  DistrictEntity,
  MahallaEntity,
  AdminEntity,
  WorkerEntity,
  RequestEntity,
  NotificationEntity
} from './entities';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get<string>('DB_HOST', 'localhost'),
        port: Number(config.get<number>('DB_PORT', 5432)),
        username: config.get<string>('DB_USER', 'postgres'),
        password: config.get<string>('DB_PASSWORD', 'postgres'),
        database: config.get<string>('DB_NAME') || config.get<string>('DB') || 'toza_hudud_db',
        entities: [
          DistrictEntity,
          MahallaEntity,
          AdminEntity,
          WorkerEntity,
          RequestEntity,
          NotificationEntity
        ],
        synchronize: true, // Auto-schema sync in development
        logging: config.get<string>('DB_LOGGING') === 'true'
      })
    })
  ]
})
export class DatabaseModule {}

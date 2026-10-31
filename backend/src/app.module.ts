import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import * as path from 'path';
import { DatabaseModule } from './database/database.module';
import { RealtimeModule } from './common/realtime/realtime.module';
import { AuthModule } from './modules/auth/auth.module';
import { DistrictsModule } from './modules/districts/districts.module';
import { MahallasModule } from './modules/mahallas/mahallas.module';
import { WorkersModule } from './modules/workers/workers.module';
import { RequestsModule } from './modules/requests/requests.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { StatsModule } from './modules/stats/stats.module';
import { PublicApiModule } from './modules/public-api/public-api.module';
import { BotModule } from './modules/bot/bot.module';
import { AdminsModule } from './modules/admins/admins.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [
        path.resolve(__dirname, '../.env'),
        path.resolve(process.cwd(), '.env'),
        '.env'
      ]
    }),
    DatabaseModule,
    RealtimeModule,
    AuthModule,
    AdminsModule,
    DistrictsModule,
    MahallasModule,
    WorkersModule,
    RequestsModule,
    NotificationsModule,
    StatsModule,
    PublicApiModule,
    BotModule
  ]
})
export class AppModule {}

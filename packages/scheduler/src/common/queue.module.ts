import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { FluxionConfigModule } from '@/config/config.module';

@Module({
  imports: [
    BullModule.forRootAsync({
      imports: [ConfigModule, FluxionConfigModule],
      useFactory: (config: ConfigService) => ({ redis: config.get('redis') }),
      inject: [ConfigService],
    }),
  ],
})
export class QueueModule {}

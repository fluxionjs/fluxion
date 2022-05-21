import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { FluxionConfigModule } from '@/config/config.module';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule, FluxionConfigModule],
      useFactory: (config: ConfigService) => config.get('orm'),
      inject: [ConfigService],
    }),
  ],
})
export class DatabaseModule {}

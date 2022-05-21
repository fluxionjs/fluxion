import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import defaultConfig from './config.default';
import devConfig from './config.development';

const NODE_ENV = process.env.NODE_ENV || 'development';

const configs = {
  development: devConfig,
};

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [defaultConfig, configs[NODE_ENV]],
    }),
  ],
})
export class FluxionConfigModule {}

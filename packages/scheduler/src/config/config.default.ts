import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { RedisOptions } from 'ioredis';

export default () => {
  const config: any = {};

  config.orm = {
    type: 'mysql',
    host: '192.168.50.187',
    port: 3307,
    username: 'admin',
    password: 'Tf@6LEvurHzTgQqvVD!3',
    database: 'fluxion',
    synchronize: true,
    logging: true,
    entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  } as TypeOrmModuleOptions;

  config.redis = {
    host: 'localhost',
    port: 55000,
    username: 'default',
    password: 'redispw',
  } as RedisOptions;

  return config;
};

import type { TypeOrmModuleOptions } from '@nestjs/typeorm';

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
    logging: false,
    entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  } as TypeOrmModuleOptions;

  return config;
};

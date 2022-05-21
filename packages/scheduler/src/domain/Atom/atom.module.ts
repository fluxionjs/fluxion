import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AtomController } from './controller/atom.controller';
import { AtomEntity } from './entity/atom.entity';
import { AtomRepository } from './repo/atom.repository';
import { AtomService } from './service/atom.service';

@Module({
  controllers: [AtomController],
  imports: [TypeOrmModule.forFeature([AtomEntity])],
  providers: [AtomRepository, AtomService],
  exports: [AtomRepository, AtomService],
})
export class AtomModule {}

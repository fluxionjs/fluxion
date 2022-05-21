import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PipelineRepository } from './repo/pipeline.repository';
import { PipelineAtomRepository } from './repo/pipeline-atom.repository';
import { PipelineService } from './service/pipeline.service';
import { PipelineAtomService } from './service/pipeline-atom.service';
import { PipelineEntity } from './entity/pipeline.entity';
import { PipelineAtomEntity } from './entity/pipeline-atom.entity';
import { AtomModule } from '../Atom/atom.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([PipelineEntity, PipelineAtomEntity]),
    AtomModule,
  ],
  providers: [
    PipelineRepository,
    PipelineAtomRepository,
    PipelineService,
    PipelineAtomService,
  ],
  exports: [
    PipelineRepository,
    PipelineAtomRepository,
    PipelineService,
    PipelineAtomService,
  ],
})
export class PipelineModule {}

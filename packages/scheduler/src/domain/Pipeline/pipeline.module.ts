import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PipelineRepository } from './repo/pipeline.repository';
import { PipelineAtomRepository } from './repo/pipeline-atom.repository';
import { PipelineService } from './service/pipeline.service';
import { PipelineAtomService } from './service/pipeline-atom.service';
import { PipelineEntity } from './entity/pipeline.entity';
import { PipelineAtomEntity } from './entity/pipeline-atom.entity';
import { PipelineController } from './controller/pipeline.controller';
import { AtomModule } from '../Atom/atom.module';
import { PipelineAtomController } from './controller/pipeline-atom.controller';
import { TaskModule } from '../Task/task.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([PipelineEntity, PipelineAtomEntity]),
    forwardRef(() => AtomModule),
    forwardRef(() => TaskModule),
  ],
  controllers: [PipelineController, PipelineAtomController],
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

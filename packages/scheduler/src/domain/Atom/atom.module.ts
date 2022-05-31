import { Module, forwardRef } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AtomController } from './controller/atom.controller';
import { AtomEntity } from './entity/atom.entity';
import { AtomRepository } from './repo/atom.repository';
import { AtomService } from './service/atom.service';
import { TaskModule } from '../Task/task.module';
import { HttpAtomWorker } from './worker/http.worker';
import { JavaScriptAtomWorker } from './worker/javascript.worker';
import { AtomWorkerService } from './service/atom-worker.service';
import { PipelineModule } from '../Pipeline/pipeline.module';

@Module({
  controllers: [AtomController],
  imports: [
    TypeOrmModule.forFeature([AtomEntity]),
    BullModule.registerQueue({
      name: 'atom-task',
    }),
    forwardRef(() => TaskModule),
    forwardRef(() => PipelineModule),
  ],
  providers: [
    AtomRepository,
    AtomService,
    AtomWorkerService,
    HttpAtomWorker,
    JavaScriptAtomWorker,
  ],
  exports: [AtomRepository, AtomService, AtomWorkerService],
})
export class AtomModule {}

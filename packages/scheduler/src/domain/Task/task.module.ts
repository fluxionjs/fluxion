import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AtomModule } from '../Atom/atom.module';
import { PipelineModule } from '../Pipeline/pipeline.module';
import { PipelineTaskEntity } from './entity/PipelineTask';
import { TaskEntity } from './entity/Task';
import { TaskResultEntity } from './entity/TaskResult';
import { PipelineTaskRepository } from './repo/pipeline-task.repository';
import { TaskResultRepository } from './repo/task-result.repository';
import { TaskRepository } from './repo/task.repository';
import { PipelineTaskService } from './service/pipeline-task.service';
import { TaskResultService } from './service/task-result.service';
import { TaskService } from './service/task.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PipelineTaskEntity,
      TaskResultEntity,
      TaskEntity,
    ]),
    AtomModule,
    PipelineModule,
  ],
  providers: [
    PipelineTaskRepository,
    TaskResultRepository,
    TaskRepository,
    PipelineTaskService,
    TaskService,
    TaskResultService,
  ],
  exports: [
    PipelineTaskRepository,
    TaskResultRepository,
    TaskRepository,
    PipelineTaskService,
    TaskService,
    TaskResultService,
  ],
})
export class TaskModule {}

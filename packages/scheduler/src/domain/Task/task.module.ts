import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AtomModule } from '../Atom/atom.module';
import { TaskService } from './service/task.service';
import { PipelineModule } from '../Pipeline/pipeline.module';
import { PipelineTaskEntity } from './entity/pipeline-task.entity';
import { TaskEntity } from './entity/task.entity';
import { TaskResultEntity } from './entity/task-result.entity';
import { PipelineTaskRepository } from './repo/pipeline-task.repository';
import { TaskResultRepository } from './repo/task-result.repository';
import { TaskRepository } from './repo/task.repository';
import { PipelineTaskService } from './service/pipeline-task.service';
import { TaskResultService } from './service/task-result.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PipelineTaskEntity,
      TaskResultEntity,
      TaskEntity,
    ]),
    forwardRef(() => AtomModule),
    forwardRef(() => PipelineModule),
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

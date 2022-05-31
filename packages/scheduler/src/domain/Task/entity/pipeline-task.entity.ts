import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  OneToOne,
} from 'typeorm';
import * as dayjs from 'dayjs';
import * as yup from 'yup';
import { dateTransformer } from '@/utils/orm';
import { TaskStatus } from '../dto/Task.dto';
import { PipelineEntity } from '@/domain/Pipeline/entity/pipeline.entity';
import { TaskEntity } from './task.entity';
import { PipelineTaskCreateDTO } from '../dto/PipelineTask.dto';

export const schema = yup.object().shape({
  pipeline: yup
    .mixed<PipelineEntity>()
    .test((input) => input instanceof PipelineEntity)
    .required(),
  status: yup
    .number()
    .integer()
    .oneOf([
      TaskStatus.failed,
      TaskStatus.pending,
      TaskStatus.running,
      TaskStatus.succeed,
    ])
    .required(),
  rootTask: yup
    .mixed<TaskEntity>()
    .test((input) => !input || input instanceof TaskEntity),
  creatorId: yup.string().min(1).required(),
});

@Entity('pipeline_task')
export class PipelineTaskEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => PipelineEntity)
  @JoinColumn({ name: 'pipeline_id' })
  pipeline: PipelineEntity;

  @Column('tinyint')
  status: TaskStatus;

  @Column({
    name: 'creator_id',
  })
  creatorId: string;

  @OneToOne(() => TaskEntity, (task) => task.pipelineTask)
  @JoinColumn({ name: 'root_task_id' })
  rootTask: TaskEntity;

  @Column({
    name: 'gmt_create',
    type: 'text',
    transformer: dateTransformer,
  })
  gmtCreate: Date = dayjs().toDate();

  @Column({
    name: 'gmt_modify',
    type: 'text',
    transformer: dateTransformer,
  })
  gmtModify: Date = dayjs().toDate();

  static create<T = PipelineTaskCreateDTO>(data: T) {
    const isValid = schema.isValidSync(data);
    if (!isValid) {
      throw schema.validateSync(data);
    }

    const entity = new PipelineTaskEntity();
    entity.pipeline = data.pipeline;
    entity.status = data.status;
    entity.creatorId = data.creatorId;
    entity.rootTask = data.rootTask;
    return entity;
  }
}

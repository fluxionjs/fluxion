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
import { AtomEntity } from '@/domain/Atom/entity/atom.entity';
import { TaskCreateDTO, TaskStatus } from '../dto/Task.dto';
import { TaskResultEntity } from './TaskResult';
import { PipelineTaskEntity } from './PipelineTask';

export const schema = yup.object().shape({
  atom: yup
    .mixed<AtomEntity>()
    .test((input) => input instanceof AtomEntity)
    .required(),
  pipelineTask: yup
    .mixed<PipelineTaskEntity>()
    .test((input) => input instanceof PipelineTaskEntity),
  result: yup
    .mixed<TaskResultEntity>()
    .test((input) => input instanceof TaskResultEntity)
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
  creatorId: yup.string().min(1).required(),
});

@Entity('task')
export class TaskEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => AtomEntity)
  @JoinColumn({ name: 'atom_id' })
  atom: AtomEntity;

  @ManyToOne(() => PipelineTaskEntity, { nullable: true })
  @JoinColumn({ name: 'pipeline_task_id' })
  pipelineTask?: PipelineTaskEntity;

  @OneToOne(() => TaskResultEntity, { nullable: true })
  @JoinColumn({ name: 'result_id' })
  result?: TaskResultEntity;

  @Column('tinyint')
  status: TaskStatus;

  @Column({
    name: 'creator_id',
  })
  creatorId: string;

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

  static create<T = TaskCreateDTO>(data: T) {
    const isValid = schema.isValidSync(data);
    if (!isValid) {
      throw schema.validateSync(data);
    }

    const entity = new TaskEntity();
    entity.atom = data.atom;
    entity.pipelineTask = data.pipelineTask;
    entity.result = data.result;
    entity.status = data.status;
    entity.creatorId = data.creatorId;
    return entity;
  }
}

import { Entity, Column, PrimaryGeneratedColumn, OneToOne } from 'typeorm';
import * as dayjs from 'dayjs';
import * as yup from 'yup';
import { dateTransformer } from '@/utils/orm';
import { TaskStatus } from '../dto/Task.dto';
import { TaskEntity } from './Task';
import { TaskResultCreateDTO } from '../dto/TaskResult.dto';

export const schema = yup.object().shape({
  task: yup
    .mixed<TaskEntity>()
    .test((input) => input instanceof TaskEntity)
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
  content: yup.mixed().required(),
  creatorId: yup.string().min(1).required(),
});

@Entity('task_result')
export class TaskResultEntity<T = any> {
  @PrimaryGeneratedColumn()
  id: number;

  @OneToOne(() => TaskEntity, (task) => task.result)
  task: TaskEntity;

  @Column('tinyint')
  status: TaskStatus;

  @Column('simple-json')
  content: T;

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

  static create<T = TaskResultCreateDTO>(data: T) {
    const isValid = schema.isValidSync(data);
    if (!isValid) {
      throw schema.validateSync(data);
    }

    const entity = new TaskResultEntity();
    entity.task = data.task;
    entity.status = data.status;
    entity.content = data.content;
    entity.creatorId = data.creatorId;
    return entity;
  }
}

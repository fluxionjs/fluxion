import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import * as dayjs from 'dayjs';
import * as yup from 'yup';
import { dateTransformer } from '@/utils/orm';
import { PipelineCreateDTO } from '../dto/Pipeline.dto';
import { PipelineAtomEntity } from './pipeline-atom.entity';

export const schema = yup.object().shape({
  name: yup.string().min(1).required(),
  description: yup.string(),
  enabled: yup.boolean(),
  creatorId: yup.string().required(),
});

@Entity('pipeline')
export class PipelineEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ nullable: true })
  description?: string;

  @Column({ default: true })
  enabled: boolean;

  @OneToOne(() => PipelineAtomEntity, { nullable: true })
  @JoinColumn({ name: 'root_atom_id' })
  rootAtom?: PipelineAtomEntity;

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

  static create<T = PipelineCreateDTO>(data: T) {
    const isValid = schema.isValidSync(data);
    if (!isValid) {
      throw schema.validateSync(data);
    }

    const entity = new PipelineEntity();
    entity.name = data.name;
    entity.description = data.description;
    entity.enabled = data.enabled;
    entity.creatorId = data.creatorId;
    return entity;
  }
}

import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import * as dayjs from 'dayjs';
import * as yup from 'yup';
import { PipelineEntity } from './pipeline.entity';
import { AtomEntity } from '@/domain/Atom/entity/atom.entity';
import { dateTransformer } from '@/utils/orm';
import { PipelineAtomCreateDTO } from '../dto/PipelineAtom.dto';

export const schema = yup.object().shape({
  parentAtom: yup
    .mixed<PipelineAtomEntity>()
    .test(input => input instanceof PipelineAtomEntity),
  pipeline: yup
    .mixed<PipelineEntity>()
    .test(input => input instanceof PipelineEntity)
    .required(),
  atom: yup
    .mixed<AtomEntity>()
    .test(input => input instanceof AtomEntity)
    .required(),
  nextAtoms: yup
    .array()
    .of(
      yup
        .mixed<PipelineAtomEntity>()
        .test(input => input instanceof PipelineAtomEntity)
    ),
  creatorId: yup.string().min(1).required(),
});

@Entity('pipeline_atom')
export class PipelineAtomEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => PipelineAtomEntity, { nullable: true })
  @JoinColumn({ name: 'parent_atom_id' })
  parentAtom: PipelineAtomEntity;

  @ManyToOne(() => PipelineEntity)
  @JoinColumn({ name: 'pipeline_id' })
  pipeline: PipelineEntity;

  @ManyToOne(() => AtomEntity)
  @JoinColumn({ name: 'atom_id' })
  atom: AtomEntity;

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

  static create<T = PipelineAtomCreateDTO>(data: T) {
    const isValid = schema.isValidSync(data);
    if (!isValid) {
      throw schema.validateSync(data);
    }

    const entity = new PipelineAtomEntity();
    entity.atom = data.atom;
    entity.pipeline = data.pipeline;
    entity.parentAtom = data.parentAtom;
    entity.creatorId = data.creatorId;
    return entity;
  }
}

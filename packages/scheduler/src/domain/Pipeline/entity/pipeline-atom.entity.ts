import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import * as dayjs from 'dayjs';
import * as yup from 'yup';
import * as url from 'url';
import { PipelineEntity } from './pipeline.entity';
import { AtomEntity } from '@/domain/Atom/entity/atom.entity';
import { dateTransformer } from '@/utils/orm';
import { PipelineAtomCreateDTO } from '../dto/PipelineAtom.dto';

export const schema = yup.object().shape({
  parentAtom: yup
    .mixed<PipelineAtomEntity>()
    .test((input) => !input || input instanceof PipelineAtomEntity),
  pipeline: yup
    .mixed<PipelineEntity>()
    .test((input) => input instanceof PipelineEntity)
    .required(),
  atom: yup
    .mixed<AtomEntity>()
    .test((input) => input instanceof AtomEntity)
    .required(),
  inputMappingCode: yup.string().test((val) => !!url.parse(val)),
  outputMappingCode: yup.string().test((val) => !!url.parse(val)),
  nextAtoms: yup
    .array()
    .of(
      yup
        .mixed<PipelineAtomEntity>()
        .test((input) => input instanceof PipelineAtomEntity),
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

  @Column('text', { name: 'input_mapping_code', nullable: true })
  inputMappingCode?: string;

  @Column('text', { name: 'output_mapping_code', nullable: true })
  outputMappingCode?: string;

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
    entity.inputMappingCode = data.inputMappingCode;
    entity.outputMappingCode = data.outputMappingCode;
    entity.creatorId = data.creatorId;
    return entity;
  }
}

import { Entity, Column, PrimaryGeneratedColumn, Index } from 'typeorm';
import * as dayjs from 'dayjs';
import * as yup from 'yup';
import * as url from 'url';
import { dateTransformer } from '@/utils/orm';
import { AtomCreateDTO } from '../dto/Atom.dto';

export const schema = yup.object().shape({
  name: yup.string().min(1).required(),
  description: yup.string(),
  enabled: yup.boolean(),
  connectUrl: yup
    .string()
    .test((val) => !!url.parse(val))
    .required(),
  creatorId: yup.string().required(),
});

@Entity('atom')
@Index(['name', 'creatorId'], { unique: true })
export class AtomEntity {
  @PrimaryGeneratedColumn()
  id: number;

  /**
   * Name of the atom
   * @type String
   */
  @Column()
  name: string;

  /**
   * Description
   * @type String
   * @optional
   */
  @Column({ nullable: true })
  description?: string;

  /**
   * Is enabled
   * @type Boolean
   * @default true
   */
  @Column({ default: true })
  enabled: boolean;

  /**
   * Connection URL string
   *
   * @type String
   * @example
   * - HTTP: `http://my-service/api/is-post-exists`
   * - gRPC: `grpc://grpc.server.com:443/my.custom.server.Service/Method`
   * - custom: `custom-provider://provider-host/event/send`
   *
   */
  @Column('text', {
    name: 'connect_url',
  })
  connectUrl: string;

  /**
   * Creator ID
   * @type String
   */
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

  static create<T = AtomCreateDTO>(data: T) {
    const isValid = schema.isValidSync(data);
    if (!isValid) {
      throw schema.validateSync(data);
    }

    const entity = new AtomEntity();
    entity.name = data.name;
    entity.description = data.description;
    entity.enabled = data.enabled;
    entity.connectUrl = data.connectUrl;
    entity.creatorId = data.creatorId;
    return entity;
  }
}

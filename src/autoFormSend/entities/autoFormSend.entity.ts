import {
  Column,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { AutoFormSendLogEntity } from './autoFormSendLog.entity';

@Entity('tb_auto_form_send')
export class AutoFormSendEntity {
  @PrimaryGeneratedColumn()
  form_list_no: string;

  @Column({ length: 256 })
  form_list_name: string;

  @Column({ length: 256 })
  company_code: string;

  @Column({ length: 256 })
  created_by: string;

  @Column({ length: 256 })
  modified_by: string;

  @Column({ type: 'timestamp', nullable: true })
  created: Date;

  @Column({ type: 'timestamp', nullable: true })
  modified: Date;

  @OneToMany(
    () => AutoFormSendLogEntity,
    (autoFormSendLog) => autoFormSendLog.autoFormSendLogEntity,
  )
  autoFormSendLogs: AutoFormSendLogEntity[];
}

import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';

@Entity('tb_auto_form_send_log')
export class AutoFormSendLogEntity {
  @PrimaryGeneratedColumn()
  form_list_log_no: string;

  @Column({ length: 256 })
  form_list_no: string;

  @Column({ length: 256 })
  corporation_name: string;

  @Column({ length: 256 })
  corporation_id: string;

  @Column({ length: 256 })
  corporation_url: string;

  @Column({ length: 1 })
  send_status: string;

  @Column({ length: 256 })
  created_by: string;

  @Column({ length: 256 })
  modified_by: string;

  @Column({ type: 'timestamp', nullable: true })
  created: Date;

  @Column({ type: 'timestamp', nullable: true })
  modified: Date;

  @ManyToOne(
    () => AutoFormSendLogEntity,
    (autoFormSendLogEntity) => autoFormSendLogEntity.form_list_no,
  )
  @JoinColumn({
    name: 'form_list_no',
    referencedColumnName: 'form_list_no',
  })
  autoFormSendLogEntity: AutoFormSendLogEntity;
}

import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryColumn,
} from 'typeorm';
import { CorporationEntity } from '../../corporations/entities/corporations.entity';
import { SalesStaffsListEntity } from '../../saleslists/entities/salesstaffslists.entity';

@Entity('tb_corporation_staff')
export class CorporationstaffEntity {
  @PrimaryColumn()
  staff_id: string;

  @PrimaryColumn()
  corporation_id: string;

  @Column({ length: 256 })
  staff_name: string;

  @Column({ length: 8 })
  job_position: string;

  @Column({ length: 8 })
  profile_source_type: string;

  @Column({ length: 256 })
  profile_link: string;

  @Column({ length: 256 })
  other_information: string;

  @Column({ length: 1 })
  employee_status: string;

  @Column({ length: 256 })
  created_by: string;

  @Column({ length: 256 })
  modified_by: string;

  @Column({ type: 'timestamp', nullable: true })
  created: Date;

  @Column({ type: 'timestamp', nullable: true })
  modified: Date;

  @ManyToOne(
    () => CorporationEntity,
    (corporationEntity) => corporationEntity.corporation_id,
  )
  @JoinColumn({
    name: 'corporation_id',
    referencedColumnName: 'corporation_id',
  })
  corporationEntity: CorporationEntity;

  @OneToOne(
    () => SalesStaffsListEntity,
    (salesStaffsList) => salesStaffsList.staff,
  )
  @JoinColumn({
    name: 'staff_id',
    referencedColumnName: 'staff_id',
  })
  salesStaffsList: SalesStaffsListEntity;
}

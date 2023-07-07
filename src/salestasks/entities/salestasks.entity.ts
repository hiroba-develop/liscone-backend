import { CompanystaffEntity } from 'src/companystaffs/entities/companystaffs.entity';
import { CorporationEntity } from 'src/corporations/entities/corporations.entity';
import { Column, Entity, PrimaryColumn, JoinColumn, ManyToOne } from 'typeorm';

@Entity('tb_sales_task')
export class SalestaskEntity {
  @PrimaryColumn()
  task_number: string;

  @Column({ length: 8 })
  task_name: string;

  @Column({ length: 256 })
  comment: string;

  @Column({ length: 10 })
  deadline: string;

  @Column({ length: 10 })
  execute_date: string;

  @Column({ length: 8 })
  execute_result: string;

  @Column({ length: 256 })
  member_id: string;

  @Column({ length: 12 })
  sales_list_number: string;

  @Column({ length: 12 })
  sales_corporation_id: string;

  @Column({ length: 12 })
  sales_staff_id: string;

  @Column({ length: 8 })
  status: string;

  @Column({ length: 256 })
  created_by: string;

  @Column({ length: 256 })
  modified_by: string;

  @Column({ type: 'timestamp', nullable: true })
  created: Date;

  @Column({ type: 'timestamp', nullable: true })
  modified: Date;

  // 기업명
  @ManyToOne(
    (type) => CorporationEntity,
    (corporationEntity) => corporationEntity.corporation_id,
  )
  @JoinColumn({
    name: 'sales_corporation_id',
    referencedColumnName: 'corporation_id',
  })
  corporationEntity: CorporationEntity;

  // 담당자명
  @ManyToOne(
    (type) => CompanystaffEntity,
    (companystaffEntity) => [
      companystaffEntity.corporation_id,
      companystaffEntity.staff_id,
    ],
  )
  @JoinColumn([
    {
      name: 'sales_corporation_id',
      referencedColumnName: 'corporation_id',
    },
    {
      name: 'sales_staff_id',
      referencedColumnName: 'staff_id',
    },
  ])
  companystaffEntity: CompanystaffEntity;
}

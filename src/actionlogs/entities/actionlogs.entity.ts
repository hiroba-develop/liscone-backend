import { Column, Entity, PrimaryColumn, JoinColumn, ManyToOne } from 'typeorm';
import { CorporationEntity } from '../../corporations/entities/corporations.entity';
import { SaleslistEntity } from '../../saleslists/entities/saleslists.entity';
import { CorporationstaffEntity } from '../../corporationstaffs/entities/corporationstaffs.entity';
import { MemberEntity } from '../../members/entities/members.entity';

@Entity('tb_sales_task')
export class ActionlogEntity {
  @PrimaryColumn()
  task_number: number;

  @Column()
  member_id: string;

  @Column()
  sales_list_number: string;

  @Column({ length: 8 })
  task_name: string;

  @Column({ length: 13 })
  sales_corporation_id: string;

  @Column({ length: 12 })
  sales_staff_id: string;

  @Column({ length: 8 })
  deadline: string;

  @Column({ length: 8 })
  execute_date: string;

  @Column({ length: 8 })
  execute_big_result: string;

  @Column({ length: 8 })
  execute_small_result: string;

  @Column({ length: 256 })
  comment: string;

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
    () => CorporationEntity,
    (corporationEntity) => corporationEntity.corporation_id,
  )
  @JoinColumn({
    name: 'sales_corporation_id',
    referencedColumnName: 'corporation_id',
  })
  corporationEntity: CorporationEntity;

  // 리스트
  @ManyToOne(
    () => SaleslistEntity,
    (saleslists) => saleslists.sales_list_number,
  )
  @JoinColumn({
    name: 'sales_list_number',
    referencedColumnName: 'sales_list_number',
  })
  saleslistEntity: SaleslistEntity;

  // 담당자
  @ManyToOne(
    () => CorporationstaffEntity,
    (corporationstaffEntity) => corporationstaffEntity.corporation_id,
  )
  @JoinColumn([
    { name: 'sales_corporation_id', referencedColumnName: 'corporation_id' },
    { name: 'sales_staff_id', referencedColumnName: 'staff_id' },
  ])
  corporationstaffEntity: CorporationstaffEntity;

  // 회원명
  @ManyToOne(() => MemberEntity, (members) => members.member_id)
  @JoinColumn({ name: 'member_id', referencedColumnName: 'member_id' })
  memberEntity: MemberEntity;
}

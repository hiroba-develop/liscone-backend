import { MemberEntity } from 'src/members/entities/members.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { SalesCorporaitonsListEntity } from './salescorporationslists.entity';
import { SalesStaffsListEntity } from './salesstaffslists.entity';

@Entity('tb_sales_list')
export class SaleslistEntity {
  @PrimaryGeneratedColumn()
  sales_list_number: number;

  @Column({ length: 256 })
  member_id: string;

  @Column({ length: 256 })
  sales_list_name: string;

  @Column({ length: 8 })
  sales_list_type: string;

  @Column({ length: 12 })
  sales_product_number: string;

  @Column({ length: 256 })
  created_by: string;

  @Column({ length: 256 })
  modified_by: string;

  @Column({ type: 'datetime' })
  created: Date;

  @Column({ type: 'datetime' })
  modified: Date;

  @ManyToOne(() => MemberEntity, (memberEntity) => memberEntity.member_id)
  @JoinColumn({
    name: 'member_id',
    referencedColumnName: 'member_id',
  })
  memberEntity: MemberEntity;

  @OneToMany(
    () => SalesCorporaitonsListEntity,
    (salesCorporations) => salesCorporations.saleslist,
  )
  @JoinColumn({
    name: 'sales_list_number',
    referencedColumnName: 'sales_list_number',
  })
  salesCorporations: SalesCorporaitonsListEntity[];

  @OneToMany(
    () => SalesStaffsListEntity,
    (salesCorporations) => salesCorporations.saleslist,
  )
  @JoinColumn({
    name: 'sales_list_number',
    referencedColumnName: 'sales_list_number',
  })
  salesStaffs: SalesStaffsListEntity[];
}

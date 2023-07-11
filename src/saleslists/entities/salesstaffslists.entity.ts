import { CorporationEntity } from 'src/corporations/entities/corporations.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryColumn,
} from 'typeorm';
import { SaleslistEntity } from './saleslists.entity';
import { CorporationstaffEntity } from 'src/corporationstaffs/entities/corporationstaffs.entity';

@Entity('tb_sales_corporation_staff')
export class SalesStaffsListEntity {
  @PrimaryColumn()
  sales_list_number: number;

  @PrimaryColumn({ length: 12 })
  corporation_id: string;

  @Column({ length: 12 })
  staff_id: string;

  @Column({ length: 256 })
  created_by: string;

  @Column({ length: 256 })
  modified_by: string;

  @Column({ type: 'datetime' })
  created: Date;

  @Column({ type: 'datetime' })
  modified: Date;

  @OneToOne(
    () => CorporationEntity,
    (corporation) => corporation.salesCorporaitonsList,
  )
  @JoinColumn({
    name: 'corporation_id',
    referencedColumnName: 'corporation_id',
  })
  corporation: CorporationEntity;

  @ManyToOne(() => SaleslistEntity, (saleslist) => saleslist.salesCorporations)
  @JoinColumn({
    name: 'sales_list_number',
    referencedColumnName: 'sales_list_number',
  })
  saleslist: SaleslistEntity;

  @OneToOne(() => CorporationstaffEntity, (staff) => staff.salesStaffsList)
  @JoinColumn({
    name: 'staff_id',
    referencedColumnName: 'staff_id',
  })
  staff: CorporationstaffEntity;
}

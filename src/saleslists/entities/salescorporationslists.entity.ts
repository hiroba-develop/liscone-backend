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

@Entity('tb_sales_corporation')
export class SalesCorporaitonsListEntity {
  @PrimaryColumn()
  sales_list_number: number;

  @PrimaryColumn({ length: 12 })
  corporation_id: string;

  @Column({ length: 256 })
  created_by: string;

  @Column({ length: 8 })
  transaction_status: string;

  @Column({ length: 256 })
  memo: string;

  @Column({ length: 256 })
  modified_by: string;

  @Column({ type: 'datetime' })
  created: Date;

  @Column({ type: 'datetime' })
  modified: Date;

  @ManyToOne(() => SaleslistEntity, (saleslist) => saleslist.salesCorporations)
  @JoinColumn({
    name: 'sales_list_number',
    referencedColumnName: 'sales_list_number',
  })
  saleslist: SaleslistEntity;

  @OneToOne(
    () => CorporationEntity,
    (corporation) => corporation.salesCorporaitonsList,
  )
  @JoinColumn({
    name: 'corporation_id',
    referencedColumnName: 'corporation_id',
  })
  corporation: CorporationEntity;
}

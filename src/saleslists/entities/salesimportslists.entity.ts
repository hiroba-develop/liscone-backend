import { CorporationEntity } from '../../corporations/entities/corporations.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryColumn,
} from 'typeorm';
import { SaleslistEntity } from './saleslists.entity';

@Entity('tb_sales_corporation_import')
export class SalesImportsListEntity {
  @PrimaryColumn()
  sales_list_number: number;

  @PrimaryColumn({ length: 13 })
  corporation_id: string;

  @Column({ length: 8 })
  transaction_status: string;

  @Column({ length: 256 })
  corporation_name: string;

  @Column({ length: 256 })
  business_category: string;

  @Column({ length: 8 })
  zip_code: string;

  @Column({ length: 256 })
  address: string;

  @Column({ length: 13 })
  representative_phone_number: string;

  @Column({ length: 256 })
  representative_name: string;

  @Column({ length: 256 })
  home_page: string;

  @Column({ length: 256 })
  sales_amount: string;

  @Column({ length: 256 })
  employee_number: string;

  @Column({ length: 256 })
  establishment_year: string;

  @Column({ length: 256 })
  capital_stock: string;

  @Column({ length: 8 })
  listing_status: string;

  @Column({ length: 256 })
  memo: string;

  @Column({ length: 256 })
  created_by: string;

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

import { CorporationEntity } from '../../corporations/entities/corporations.entity';
import { SaleslistEntity } from './saleslists.entity';
import {
  Column,
  Entity,
  JoinColumn,
  OneToMany,
  PrimaryColumn,
  ManyToOne,
} from 'typeorm';

@Entity('tb_sales_corporation')
export class SalesListcorporationDetail {
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

  @ManyToOne(() => CorporationEntity, (saleslist) => saleslist.corporation_id)
  @JoinColumn({
    name: 'corporation_id',
    referencedColumnName: 'corporation_id',
  })
  corporationEntity: CorporationEntity[];

  @ManyToOne(() => SaleslistEntity, (saleslist) => saleslist.salesCorporations)
  @JoinColumn({
    name: 'sales_list_number',
    referencedColumnName: 'sales_list_number',
  })
  saleslistEntity: SaleslistEntity[];
}

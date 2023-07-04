import { Column, Entity, ManyToOne, PrimaryColumn } from 'typeorm';
import { SaleslistEntity } from './saleslists.entity';

@Entity('tb_sales_corporation_staff')
export class SalesStaffsListEntity {
  @PrimaryColumn()
  sales_list_number: number;

  @PrimaryColumn({ length: 12 })
  corporation_id: string;

  @PrimaryColumn({ length: 12 })
  staff_id: string;

  @Column({ length: 256 })
  created_by: string;

  @Column({ length: 256 })
  modified_by: string;

  @Column({ type: 'datetime' })
  created: Date;

  @Column({ type: 'datetime' })
  modified: Date;
}

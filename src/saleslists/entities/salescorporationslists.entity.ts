import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('tb_sales_corporation')
export class SalesCorporaitonsListEntity {
  @PrimaryColumn()
  sales_list_number: number;

  @PrimaryColumn({ length: 12 })
  company_id: string;

  @Column({ length: 256 })
  created_by: string;

  @Column({ length: 256 })
  modified_by: string;

  @Column({ type: 'datetime' })
  created: Date;

  @Column({ type: 'datetime' })
  modified: Date;
}

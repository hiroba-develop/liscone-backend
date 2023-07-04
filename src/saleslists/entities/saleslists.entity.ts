import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

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
}

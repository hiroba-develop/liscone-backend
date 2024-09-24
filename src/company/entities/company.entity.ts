import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('tb_company')
export class CompanyEntity {
  @PrimaryColumn({ length: 8 })
  company_code: string;

  @Column({ length: 256 })
  company_name: string;

  @Column({ length: 1 })
  form_status: string;

  @Column({ length: 256 })
  created_by: string;

  @Column({ length: 256 })
  modified_by: string;

  @Column({ type: 'timestamp', nullable: true })
  created: Date;

  @Column({ type: 'timestamp', nullable: true })
  modified: Date;
}

import { CompanystaffEntity } from 'src/companystaffs/entities/companystaffs.entity';
import { Column, Entity, JoinColumn, OneToMany, PrimaryColumn } from 'typeorm';

@Entity('tb_corporation')
export class CorporationEntity {
  @PrimaryColumn()
  corporation_id: string;

  @Column({ length: 256 })
  corporation_name: string;

  @Column({ length: 13 })
  corporate_number: string;

  @Column({ length: 256 })
  address: string;

  @Column({ length: 8 })
  business_category: string;

  @Column({ length: 256 })
  capital_stock: string;

  @Column({ length: 256 })
  created_by: string;

  @Column({ length: 256 })
  employee_number: string;

  @Column({ length: 256 })
  establishment_year: string;

  @Column({ length: 256 })
  home_page: string;

  @Column({ length: 8 })
  listing_status: string;

  @Column({ length: 256 })
  modified_by: string;

  @Column({ length: 256 })
  representative_name: string;

  @Column({ length: 13 })
  representative_phone_number: string;

  @Column({ length: 256 })
  sales_amount: string;

  @Column({ length: 8 })
  zip_code: string;

  @Column({ type: 'timestamp', nullable: true })
  created: Date;

  @Column({ type: 'timestamp', nullable: true })
  modified: Date;

  @OneToMany(
    (type) => CompanystaffEntity,
    (companystaffEntity) => companystaffEntity.corporation_id,
  )
  @JoinColumn({
    name: 'corporation_id',
    referencedColumnName: 'corporation_id',
  })
  companystaffEntity: CompanystaffEntity;
}

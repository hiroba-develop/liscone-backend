import { CorporationstaffEntity } from '../../corporationstaffs/entities/corporationstaffs.entity';
import { SalesCorporaitonsListEntity } from '../../saleslists/entities/salescorporationslists.entity';
import { SalesStaffsListEntity } from '../../saleslists/entities/salesstaffslists.entity';
import {
  Column,
  Entity,
  JoinColumn,
  OneToMany,
  OneToOne,
  PrimaryColumn,
} from 'typeorm';

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

  @Column()
  average_age: string;
  @Column()
  business_detail: string;
  @Column()
  human_capital_running_evaluation: string;
  @Column()
  human_capital_running_evidence: string;
  @Column()
  human_capital_running_url: string;
  @Column()
  human_resources_educational_evaluation: string;
  @Column()
  human_resources_educational_evidence: string;
  @Column()
  human_resources_educational_url: string;
  @Column()
  legacy_company_evaluation: string;
  @Column()
  legacy_company_evidence: string;
  @Column()
  legacy_company_url: string;
  @Column()
  new_business_evaluation: string;
  @Column()
  new_business_evidence: string;
  @Column()
  new_business_url: string;
  @Column()
  digital_marketing_evaluation: string;
  @Column()
  digital_marketing_evidence: string;
  @Column()
  digital_marketing_url: string;
  @Column()
  sns_evaluation: string;
  @Column()
  sns_evidence: string;
  @Column()
  sns_url: string;
  @Column()
  sns_line_account: string;
  @Column()
  sns_twitter: string;
  @Column()
  sns_instagram: string;
  @Column()
  sns_tiktok: string;
  @Column()
  sns_youtube: string;
  @Column()
  sns_facebook: string;
  @Column()
  source_code: string;
  @Column()
  site_pv: string;
  @Column()
  publishers: string;
  @Column()
  ad_networks: string;

  @OneToMany(
    () => CorporationstaffEntity,
    (corporationstaffEntity) => corporationstaffEntity.corporation_id,
  )
  @JoinColumn({
    name: 'corporation_id',
    referencedColumnName: 'corporation_id',
  })
  corporationstaffEntity: CorporationstaffEntity[];

  @OneToOne(
    () => SalesCorporaitonsListEntity,
    (salesCorporaitonsList) => salesCorporaitonsList.corporation,
  )
  @JoinColumn({
    name: 'corporation_id',
    referencedColumnName: 'corporation_id',
  })
  salesCorporaitonsList: SalesCorporaitonsListEntity;

  @OneToOne(
    () => SalesStaffsListEntity,
    (salesStaffsList) => salesStaffsList.corporation,
  )
  @JoinColumn({
    name: 'corporation_id',
    referencedColumnName: 'corporation_id',
  })
  salesStaffsList: SalesStaffsListEntity;
}

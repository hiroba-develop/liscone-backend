import { Column, Entity, PrimaryColumn,ManyToOne,JoinColumn } from 'typeorm';
import { CorporationEntity } from '../../corporations/entities/corporations.entity';

@Entity('tb_recruit')
export class RecruitEntity {
  @PrimaryColumn()
  recruit_id: string;

  @PrimaryColumn()
  corporation_id: string;

  @Column({ length: 256 })
  recruit_large_category: string;

  @Column({ length: 256 })
  recruit_middle_category: string;

  @Column({ length: 256 })
  recruit_small_category: string;

  @Column({ length: 256 })
  created_by: string;

  @Column({ length: 256 })
  modified_by: string;

  @Column({ type: 'timestamp', nullable: true })
  created: Date;

  @Column({ type: 'timestamp', nullable: true })
  modified: Date;

  @ManyToOne(() => CorporationEntity, (corporationEntity) => corporationEntity.corporation_id)
  @JoinColumn({
    name: 'corporation_id',
    referencedColumnName: 'corporation_id',
  })
  corporationEntity: CorporationEntity;
}

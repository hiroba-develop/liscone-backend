import { IsString } from 'class-validator';
import { CorporationEntity } from 'src/corporations/entities/corporations.entity';

export class CreateCorporationstaffDTO {
  @IsString()
  staff_id: string;

  @IsString()
  staff_name: string;

  @IsString()
  job_position: string;

  @IsString()
  corporation_id: string;

  @IsString()
  corporation_name: string;

  @IsString()
  employee_number: string;

  @IsString()
  employee_from_number: string;

  @IsString()
  employee_to_number: string;

  @IsString()
  profile_source_type: string;

  @IsString()
  profile_link: string;

  @IsString()
  other_information: string;

  @IsString()
  created_by: string;

  @IsString()
  modified_by: string;

  created: Date;

  modified: Date;

  corporationEntity: CorporationEntity;
}

import { IsOptional, IsString, IsDateString } from 'class-validator';

export class UpdateMemberDTO {
  @IsString()
  member_id: string;

  @IsString()
  company_code: string;

  @IsString()
  member_name: string;

  @IsString()
  password: string;

  @IsString()
  dormant_status: string;

  @IsString()
  password_expired_day: string;

  @IsString()
  created_by: string;

  @IsString()
  modified_by: string;

  created: Date;

  modified: Date;
}

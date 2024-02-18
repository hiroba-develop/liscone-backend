import { IsOptional, IsString } from 'class-validator';

export class CreateRecruitDTO {
  @IsString()
  recruit_id: string;

  @IsString()
  corporation_id: string;

  @IsString()
  recruit_large_category: string;

  @IsString()
  recruit_middle_category: string;

  @IsString()
  recruit_small_category: string;

  @IsString()
  created_by: string;

  @IsString()
  modified_by: string;

  created: Date;

  modified: Date;
}

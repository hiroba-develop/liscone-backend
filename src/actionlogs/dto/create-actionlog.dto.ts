import { IsNumber, IsString } from 'class-validator';

export class CreateActionlogDTO {
  @IsNumber()
  task_number: number;

  @IsString()
  member_id: string;

  @IsString()
  sales_list_number: string;

  @IsString()
  task_name: string;

  @IsString()
  sales_corporation_id: string;

  @IsString()
  sales_staff_id: string;

  @IsString()
  deadline: string;

  @IsString()
  execute_from_date: string;

  @IsString()
  execute_to_date: string;

  @IsString()
  execute_date: string;

  @IsString()
  execute_major_result: string;

  @IsString()
  execute_minor_result: string;

  @IsString()
  execute_result: string;

  @IsString()
  comment: string;

  @IsString()
  status: string;

  // 기업명 sales_target : CorporationEntity.corporation_id - corporation_name
  @IsString()
  corporation_name: string;

  // 법인번호 sales_target : CorporationEntity.corporation_id - corporate_number
  @IsString()
  corporate_number: string;

  /// 리스트명 sales_list_number : CorporationEntity.sales_list_number - sales_list_name
  @IsString()
  sales_list_name: string;

  /// 담당자명 sales_target : Companystaffs.corporation_id - sales_list_name
  @IsString()
  staff_name: string;

  /// 회원명 member_id : MemberEntity.member_id - member_name
  @IsString()
  member_name: string;

  @IsString()
  created_by: string;

  @IsString()
  modified_by: string;

  created: Date;

  modified: Date;
}

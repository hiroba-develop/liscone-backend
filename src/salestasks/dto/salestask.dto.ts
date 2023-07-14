import { IsNumber, IsString } from 'class-validator';

export class SalesTaskDTO {
  @IsString()
  task_number: string;

  @IsString()
  comment: string;

  @IsString()
  created_by: string;

  @IsString()
  deadline: string;

  @IsString()
  execute_date: string;

  @IsString()
  execute_big_result: string;

  @IsString()
  execute_small_result: string;

  @IsString()
  member_id: string;

  @IsString()
  modified_by: string;

  @IsNumber()
  sales_list_number: number;

  @IsString()
  sales_corporation_id: string;

  @IsString()
  sales_corporaiton_name: string;

  @IsString()
  sales_staff_id: string;

  @IsString()
  sales_staff_name: string;

  @IsString()
  status: string;

  @IsString()
  task_name: string;

  created: Date;

  modified: Date;
}

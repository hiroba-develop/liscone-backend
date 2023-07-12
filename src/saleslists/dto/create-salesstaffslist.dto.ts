import { IsNumber, IsString } from 'class-validator';

export class CreateSalesStaffsListDTO {
  @IsNumber()
  sales_list_number: number;

  @IsString()
  corporation_id: string;

  @IsString()
  staff_id: string;

  @IsString()
  transaction_status: string;

  @IsString()
  memo: string;

  @IsString()
  created_by: string;

  @IsString()
  modified_by: string;

  created: Date;

  modified: Date;
}

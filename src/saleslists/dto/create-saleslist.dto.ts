import { IsNumber, IsString } from 'class-validator';

export class CreateSaleslistDTO {
  @IsNumber()
  sales_list_number: number;

  datas: [];

  staffLists: object;

  @IsString()
  company_id: string;

  @IsString()
  member_id: string;

  @IsString()
  sales_list_name: string;

  @IsString()
  sales_list_type: string;

  @IsString()
  sales_product_number: string;

  @IsString()
  created_by: string;

  @IsString()
  modified_by: string;

  created: Date;

  modified: Date;
}

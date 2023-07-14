import { IsNumber, IsString } from 'class-validator';

export class SaleslistViewDTO {
  @IsNumber()
  sales_list_number: number;

  @IsString()
  sales_list_name: string;

  @IsNumber()
  listCount: number;
  @IsNumber()
  proceedCount: number;
  @IsNumber()
  projectCount: number;
  @IsNumber()
  contractCount: number;
  @IsNumber()
  expectSales: number;

  @IsString()
  member_id: string;

  @IsString()
  member_name: string;

  @IsString()
  sales_list_type: string;
}

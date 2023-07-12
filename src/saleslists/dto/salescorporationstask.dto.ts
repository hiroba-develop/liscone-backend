import { IsNumber, IsString } from 'class-validator';

export class SalesCorporationsTaskDTO {
  @IsNumber()
  sales_list_number: number;
  @IsString()
  corporation_id: string;
  @IsString()
  corporate_number: string;

  @IsString()
  corporation_name: string;
  @IsString()
  business_category: string;
  @IsString()
  zip_code: string;
  @IsString()
  address: string;
  @IsString()
  representative_phone_number: string;
  @IsString()
  representative_name: string;
  @IsString()
  home_page: string;
  @IsString()
  sales_amount: string;
  @IsString()
  employee_number: string;
  @IsString()
  establishment_year: string;
  @IsString()
  capital_stock: string;
  @IsString()
  listing_status: string;
  @IsString()
  transaction_status: string;
  @IsString()
  taskCount: string;
}

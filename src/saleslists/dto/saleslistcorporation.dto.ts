import { IsNumber, IsString } from 'class-validator';

export class SaleslistCorporationDTO {
  @IsNumber()
  sales_list_number: number;

  @IsString()
  corporation_id: string;

  @IsString()
  corporation_name: string;

  @IsString()
  corporate_number: string;

  @IsString()
  address: string;

  @IsString()
  business_category: string;

  @IsString()
  home_page: string;

  @IsString()
  listing_status: string;

  @IsString()
  representative_name: string;

  @IsString()
  representative_phone_number: string;

  @IsString()
  sales_amount: string;

  @IsString()
  capital_stock: string;

  @IsString()
  employee_number: string;

  @IsString()
  establishment_year: string;

  @IsString()
  zip_code: string;
}

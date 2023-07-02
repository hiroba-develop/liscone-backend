import { IsString } from 'class-validator';

export class CreateSalesCorporationsListDTO {
  @IsString()
  sales_list_number: number;

  company_ids: [];

  @IsString()
  company_code: string;

  @IsString()
  created_by: string;

  @IsString()
  modified_by: string;

  created: Date;

  modified: Date;
}

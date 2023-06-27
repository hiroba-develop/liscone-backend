import { IsOptional, IsString } from "class-validator";

export class CreateCorporationDTO {
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
    sales_from_amount: string;
    sales_to_amount: string;
    
    @IsString()
    capital_stock: string;
    capital_from_stock: string;
    capital_to_stock: string;
    
    @IsString()
    employee_number: string;
    employee_from_number: string;
    employee_to_number: string;
    
    @IsString()
    establishment_year: string;
    establishment_from_year: string;
    establishment_to_year: string;

    @IsString()
    zip_code: string;

    @IsString()
    created_by: string;
    
    @IsString()
    modified_by: string;

    created: Date;
    
    modified: Date;
}


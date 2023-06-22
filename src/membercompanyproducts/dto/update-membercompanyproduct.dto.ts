import { IsOptional, IsString, IsDateString } from "class-validator";

export class UpdateMembercompanyproductDTO {
    @IsString()
    product_number: string;
    
    @IsString()
    company_code: string;
    
    @IsString()
    product_name: string;

    @IsString()
    product_price: string;

    @IsString()
    created_by: string;

    @IsString()
    modified_by: string;

    created: Date;

    modified: Date;
}
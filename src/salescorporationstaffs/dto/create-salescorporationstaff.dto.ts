import { IsOptional, IsString } from "class-validator";

export class CreateSalesCorporationstaffDTO {
    @IsString()
    staff_id: string;

    @IsString()
    corporation_id: string;

    @IsString()
    sales_list_number: string;

    @IsString()
    memo: string;

    @IsString()
    created_by: string;   
    
    @IsString()
    modified_by: string;
    
    created: Date;
    
    modified: Date;
}


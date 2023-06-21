import { IsOptional, IsString } from "class-validator";

export class CreateMemberDTO {
    @IsString()
    member_id: string;

    @IsString()
    company_code: string;

    @IsString()
    member_name: string;
    
    @IsString()
    password: string;
    
    @IsString()
    dormant_status: string;
    
    @IsString()
    password_expired_day: number;
    
    @IsString()
    created_by: string;
    
    @IsString()
    modified_by: string;
    
    created: Date;
    
    modified: Date;
}


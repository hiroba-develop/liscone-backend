import { IsOptional, IsString, IsDateString } from "class-validator";

export class UpdateMemberSalestaskDTO {    
    
    @IsString()
    member_id: string;

    @IsString()
    task_number: string;
    
    @IsDateString()
    assign_date: string;

    @IsString()
    assign_confirm: string;

    @IsString()
    status: string;
    
    @IsString()
    created_by: string;

    @IsString()
    modified_by: string;

    created: Date;
    
    modified: Date;
}


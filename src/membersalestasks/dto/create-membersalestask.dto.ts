import { IsDateString, IsOptional, IsString, IsDate } from "class-validator";

export class CreateMemberSalestaskDTO {
    @IsString()
    member_id: string;

    @IsString()
    task_number: string;

    @IsDateString()
    assign_date: string;

    @IsDateString()
    assign_from_date: string;
    
    @IsDateString()
    assign_to_date: string;

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


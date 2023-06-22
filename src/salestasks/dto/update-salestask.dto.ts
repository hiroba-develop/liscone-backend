import { IsOptional, IsString, IsDateString } from "class-validator";

export class UpdateSalestaskDTO {
    @IsString()
    task_number: string;

    @IsString()
    comment: string;

    @IsString()
    created_by: string;

    @IsString()
    deadline: string;

    @IsString()
    execute_date: string;

    @IsString()
    execute_result: string;

    @IsString()
    member_id: string;

    @IsString()
    modified_by: string;

    @IsString()
    sales_list_number: string;

    @IsString()
    sales_target: string;

    @IsString()
    status: string;

    @IsString()
    task_name: string;

    created: Date;
    
    modified: Date;
}
export interface  MemberSalestask {
    member_id: string;
    task_number: string;
    assign_date: string;
    assign_confirm: string;
    created_by: string;
    modified_by: string;
    created: Date;
    modified: Date;
    
    // member info
    company_code: string;
    member_name: string;
    password: string;
    dormant_status: string;
    password_expired_day: number;

    // salestask info
    task_name: string;
    comment: string;
    deadline: string;
    execute_date: string;
    execute_result: string;
    sales_list_number: string;
    sales_target: string;
    status: string;
}
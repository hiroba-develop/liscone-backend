import { Column, Entity, PrimaryColumn, JoinColumn, ManyToOne} from 'typeorm';

@Entity('tb_sales_task')
export class SalestaskEntity {
    @PrimaryColumn()
    task_number: string;
    
    @Column( {length: 8} )
    task_name: string;

    @Column( {length: 256} )
    comment: string;

    @Column( {length: 8} )
    deadline: string;

    @Column( {length: 8} )
    execute_date: string;

    @Column( {length: 8} )
    execute_result: string;

    @Column( {length: 256} )
    member_id: string;

    @Column( {length: 12} )
    sales_list_number: string;

    @Column( {length: 12} )
    sales_target: string;

    @Column( {length: 8} )
    status: string;

    @Column( {length: 256} )
    created_by: string;

    @Column( {length: 256} )
    modified_by: string;

    @Column( {type:"timestamp", nullable:true})
    created: Date;
    
    @Column( {type:"timestamp", nullable:true})
    modified: Date;
}
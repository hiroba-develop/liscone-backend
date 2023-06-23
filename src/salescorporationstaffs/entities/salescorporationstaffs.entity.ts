import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('tb_sales_corporation_staff')
export class SalesCorporationstaffEntity {
    @PrimaryColumn()
    staff_id: string;

    @Column( {length: 12} )
    corporation_id: string;

    @Column( {length: 12} )
    sales_list_number: string;

    @Column( {length: 256} )
    memo: string;

    @Column( {length: 256} )
    created_by: string;
    
    @Column( {length: 256} )
    modified_by: string;
    
    @Column( {type:"timestamp", nullable:true})
    created: Date;
    
    @Column( {type:"timestamp", nullable:true})
    modified: Date;


}
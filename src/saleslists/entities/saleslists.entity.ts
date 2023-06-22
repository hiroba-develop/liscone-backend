import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('tb_sales_list')
export class SaleslistEntity {
    @PrimaryColumn( )
    sales_list_number: string;

    @Column( {length: 256} )
    member_id: string;

    @Column( {length: 256} )
    sales_list_name: string;

    @Column( {length: 8} )
    sales_list_type: string;

    @Column( {length: 12} )
    sales_product_number: string;

    @Column( {length: 256} )
    created_by: string;

    @Column( {length: 256} )
    modified_by: string;

    @Column( {type:"timestamp", nullable:true})
    created: Date;

    @Column( {type:"timestamp", nullable:true})
    modified: Date;
}
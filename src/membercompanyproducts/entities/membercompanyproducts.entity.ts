import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('tb_member_company_product')
export class MembercompanyproductEntity {
    @PrimaryColumn()
    product_number: string;
    
    @Column( {length: 8} )
    company_code: string;
    
    @Column( {length: 8} )
    product_name: string;

    @Column( {length: 256} )
    product_price: string;
    
    @Column( {length: 256} )
    created_by: string;

    @Column( {length: 256} )
    modified_by: string;

    @Column( {type:"timestamp", nullable:true})
    created: Date;

    @Column( {type:"timestamp", nullable:true})
    modified: Date;
}
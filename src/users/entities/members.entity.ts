import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('Member')
export class MemberEntity {
    @PrimaryColumn()
    member_id: string;

    @Column( {length: 8} )
    company_code: string;

    @Column( {length: 256} )
    member_name: string;

    @Column( {length: 256} )
    password: string;

    @Column( {length: 8} )
    dormant_status: string;

    @Column()
    password_expired_day: number;
    
    @Column( {length: 256} )
    created_by: string;

    @Column( {length: 256} )
    modified_by: string;

    @Column()
    created: string;
    
    @Column()
    modified: string;
}
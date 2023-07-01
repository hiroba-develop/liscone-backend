import { Column, Entity, PrimaryColumn, JoinColumn, ManyToOne} from 'typeorm';
import { SalestaskEntity } from '../../salestasks/entities/salestasks.entity';
import { MemberEntity } from '../../members/entities/members.entity';

@Entity('tb_my_sales_task')
export class MemberSalestaskEntity {
    @PrimaryColumn()
    member_id: string;
    
    @PrimaryColumn()
    task_number: string;
    
    @Column( {length: 8} )
    assign_date: string;

    @Column( {length: 256} )
    assign_confirm: string;
    
    @Column( {length: 256} )
    created_by: string;

    @Column( {length: 256} )
    modified_by: string;

    @Column( {type:"timestamp", nullable:true})
    created: Date;
    
    @Column( {type:"timestamp", nullable:true})
    modified: Date;

    @ManyToOne(type => MemberEntity , memberentity => memberentity.member_id)
    @JoinColumn({name: 'member_id', referencedColumnName: 'member_id'})
    memberEntity: MemberEntity;

    @ManyToOne(type => SalestaskEntity , salestaskEntity => salestaskEntity.task_number)
    @JoinColumn({name: 'task_number', referencedColumnName: 'task_number'})
    salestaskEntity: SalestaskEntity;
    
}
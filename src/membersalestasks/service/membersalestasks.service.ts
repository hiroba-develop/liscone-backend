import { Inject, Injectable, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, LessThan, MoreThan } from 'typeorm';
import { CreateMemberSalestaskDTO } from '../dto/create-membersalestask.dto';
import { UpdateMemberSalestaskDTO } from '../dto/update-membersalestask.dto';
import { MemberSalestaskEntity} from '../entities/membersalestasks.entity';

@Injectable()
export class MemberSalestasksService {
    constructor(
        @InjectRepository(MemberSalestaskEntity)
        private membersalestasksRepository: Repository<MemberSalestaskEntity>,
    ) { }

    findAll(): Promise<MemberSalestaskEntity[]> {
        return this.membersalestasksRepository.find({relations:['memberEntity','salestaskEntity']});
    }

    findAllMemberSalesTask(memberSalestask: CreateMemberSalestaskDTO) : Promise<MemberSalestaskEntity[]> {
        return this.membersalestasksRepository.find(
            {
              where: 
              { 
                member_id: memberSalestask.member_id, 
                assign_date: Between(memberSalestask.assign_from_date, memberSalestask.assign_to_date), 
                salestaskEntity: {
                    status: memberSalestask.status,
                },
              } ,
              relations:['memberEntity','salestaskEntity'] 
            }
        );
    }
    
    async create(membersalestask: CreateMemberSalestaskDTO) {
        await this.membersalestasksRepository.save(membersalestask)
    }

    async update(membersalestask: CreateMemberSalestaskDTO) {
        const resultsalestask = await this.findAllMemberSalesTask(membersalestask);
        if (!resultsalestask) {
            throw new NotFoundException("member_id and task_number is not exist");
        }
        try{
            await this.membersalestasksRepository.update(
                {
                    member_id: membersalestask.member_id , 
                    task_number: membersalestask.task_number
                }, 
                {
                    assign_date: membersalestask.assign_date ,
                    assign_confirm: membersalestask.assign_confirm ,
                    modified_by: membersalestask.modified_by
                }
                );
           return await this.findAllMemberSalesTask(membersalestask);
        } catch (e) {
            console.log('there is no member_id / task_number : ' + membersalestask.member_id + '/' + membersalestask.task_number);
            throw e;
        }
    }
    
    async remove(membersalestask: UpdateMemberSalestaskDTO): Promise<void> {
        await this.membersalestasksRepository.delete({
            member_id: membersalestask.member_id , 
            task_number: membersalestask.task_number
        });
    }
}
import { Inject, Injectable, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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

    findAllMemberSalesTask(member_id: string, task_number: string) : Promise<MemberSalestaskEntity[]> {
        return this.membersalestasksRepository.find({
            where: {member_id, task_number},
            relations:['memberEntity','salestaskEntity'] 
            }
        );
    }
    
    async create(membersalestask: CreateMemberSalestaskDTO) {
        await this.membersalestasksRepository.save(membersalestask)
    }

    async update(membersalestask: UpdateMemberSalestaskDTO) {
        const resultsalestask = await this.findAllMemberSalesTask(membersalestask.member_id, membersalestask.task_number);
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
           return await this.findAllMemberSalesTask(membersalestask.member_id, membersalestask.task_number);
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
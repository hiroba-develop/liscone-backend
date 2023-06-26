import { Inject, Injectable, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateSalestaskDTO } from '../dto/create-salestask.dto';
import { SalestaskEntity } from '../entities/salestasks.entity';
import { UpdateSalestaskDTO } from '../dto/update-salestask.dto';

@Injectable()
export class SalestasksService {
    constructor(
        @InjectRepository(SalestaskEntity)
        private salestasksRepository: Repository<SalestaskEntity>,
    ) { }

    findAll(): Promise<SalestaskEntity[]> {
        return this.salestasksRepository.find();
    }

    
    findBySalestaskMemberId(member_id: string): Promise<SalestaskEntity> {
        return this.salestasksRepository.findOne({
            where: {
                member_id,
            }
        });
    }
    
    findBySalestaskTaskName(task_name: string): Promise<SalestaskEntity> {
        return this.salestasksRepository.findOne({
            where: {
                task_name,
            }
        });
    }
    
    findBySalestaskTaskNumber(task_number: string): Promise<SalestaskEntity> {
        return this.salestasksRepository.findOne({
            where: {
                task_number,
            }
        });
    }

    async create(salestask: CreateSalestaskDTO) {
        await this.salestasksRepository.save(salestask)
    }

    async update(salestask: UpdateSalestaskDTO) {
        const resultsalestask = await this.findBySalestaskTaskNumber(salestask.task_number);
        if (!resultsalestask) {
            throw new NotFoundException("task_number is not exist");
        }
        try{
            await this.salestasksRepository.update(
                salestask.task_number, 
                {
                    comment: salestask.comment,
                    created_by: salestask.created_by,
                    deadline: salestask.deadline,
                    execute_date: salestask.execute_date,
                    execute_result: salestask.execute_result,
                    member_id: salestask.member_id,
                    modified_by: salestask.modified_by,
                    sales_list_number: salestask.sales_list_number,
                    sales_target: salestask.sales_target,
                    status: salestask.status,
                    task_name: salestask.task_name 
                });
            return await this.findBySalestaskTaskNumber(salestask.task_number);
        } catch (e) {
            console.log('there is no task_number : ' + salestask.task_number);
            throw e;
        }
    }
    
    async remove(id: string): Promise<void> {
        await this.salestasksRepository.delete(id);
    }
}
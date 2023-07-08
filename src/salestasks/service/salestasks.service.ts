import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SalesTaskDTO } from '../dto/salestask.dto';
import { SalestaskEntity } from '../entities/salestasks.entity';

@Injectable()
export class SalestasksService {
  constructor(
    @InjectRepository(SalestaskEntity)
    private salestasksRepository: Repository<SalestaskEntity>,
  ) {}

  async findAll(member_id: string): Promise<SalestaskEntity[]> {
    const response = await this.salestasksRepository.find({
      relations: ['corporationEntity', 'corporationstaffEntity'],
      where: {
        member_id,
      },
    });
    console.log(response);
    return response;
  }

  findBySalestaskMemberId(member_id: string): Promise<SalestaskEntity> {
    return this.salestasksRepository.findOne({
      where: {
        member_id,
      },
    });
  }

  findBySalestaskTaskName(task_name: string): Promise<SalestaskEntity> {
    return this.salestasksRepository.findOne({
      where: {
        task_name,
      },
    });
  }

  findBySalestaskTaskNumber(task_number: string): Promise<SalestaskEntity> {
    return this.salestasksRepository.findOne({
      where: {
        task_number,
      },
    });
  }

  async create(salestask: SalesTaskDTO) {
    await this.salestasksRepository.save({
      member_id: salestask.member_id,
      task_name: salestask.task_name,
      sales_list_number: salestask.sales_list_number,
      sales_corporation_id: salestask.sales_corporation_id,
      sales_staff_id: salestask.sales_staff_id,
      deadline: salestask.deadline,
      comment: salestask.comment,
    });
  }

  async update(salestask: SalesTaskDTO) {
    const resultsalestask = await this.findBySalestaskTaskNumber(
      salestask.task_number,
    );
    if (!resultsalestask) {
      throw new NotFoundException('task_number is not exist');
    }
    try {
      await this.salestasksRepository.update(salestask.task_number, {
        execute_date: salestask.execute_date,
        execute_result: salestask.execute_result,
      });
      return await this.findBySalestaskTaskNumber(salestask.task_number);
    } catch (e) {
      console.log('there is no task_number : ' + salestask.task_number);
      throw e;
    }
  }

  async updateSalesTask(salestask: SalesTaskDTO) {
    const resultsalestask = await this.findBySalestaskTaskNumber(
      salestask.task_number,
    );
    if (!resultsalestask) {
      throw new NotFoundException('task_number is not exist');
    }
    try {
      await this.salestasksRepository.update(salestask.task_number, {
        task_name: salestask.task_name,
        deadline: salestask.deadline,
        member_id: salestask.member_id,
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

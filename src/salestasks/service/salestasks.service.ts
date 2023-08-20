import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SalesTaskDTO } from '../dto/salestask.dto';
import { SalestaskEntity } from '../entities/salestasks.entity';
import { BigResult } from '../entities/salesTaskBRView.entity';
import { SmallResult } from '../entities/salesTaskSRView.entity';

@Injectable()
export class SalestasksService {
  constructor(
    @InjectRepository(SalestaskEntity)
    private salestasksRepository: Repository<SalestaskEntity>,
    @InjectRepository(BigResult)
    private salesTaskBRRepository: Repository<BigResult>,
    @InjectRepository(SmallResult)
    private salesTaskSRRepository: Repository<SmallResult>,
  ) {}

  async findAll(): Promise<SalestaskEntity[]> {
    const response = await this.salestasksRepository.find({
      relations: ['corporationEntity', 'corporationstaffEntity', 'memberslist'],
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
  findBySalestaskTaskBR(
    member_id: [],
    sales_list_number: [],
    execute_dateFrom: string,
    execute_dateTo: string,
  ): Promise<SalestaskEntity> {
    const query = this.salestasksRepository.createQueryBuilder('st');
    query.select(
      'count(case when st.execute_big_result = "BR01" then 1 end) as BR01',
    );
    query.addSelect(
      'count(case when st.execute_big_result = "BR02" then 1 end) as BR02',
    );
    query.addSelect(
      'count(case when st.execute_big_result = "BR03" then 1 end) as BR03',
    );
    query.addSelect(
      'count(case when st.execute_big_result = "BR04" then 1 end) as BR04',
    );
    query.addSelect(
      'count(case when st.execute_big_result = "BR05" then 1 end) as BR05',
    );
    query.addSelect(
      'count(case when st.execute_big_result = "BR06" then 1 end) as BR06',
    );
    query.leftJoin('st.saleslist', 'saleslist');
    if (member_id !== null) {
      query.andWhere('st.member_id IN (:member_id)', {
        member_id: member_id,
      });
    }
    if (sales_list_number !== null) {
      query.andWhere('st.sales_list_number IN (:sales_list_number)', {
        sales_list_number: sales_list_number,
      });
    }
    if (execute_dateFrom !== '' && execute_dateFrom !== null) {
      query.andWhere('st.execute_date >= :execute_dateFrom', {
        execute_dateFrom: execute_dateFrom,
      });
    }
    if (execute_dateTo !== '' && execute_dateTo !== null) {
      query.andWhere('st.execute_date <= :execute_dateTo', {
        execute_dateTo: execute_dateTo,
      });
    }
    query.groupBy('saleslist.sales_list_number');
    return query.getRawOne();
  }

  findBySalestaskTaskSR(
    member_id: [],
    sales_list_number: [],
    execute_dateFrom: string,
    execute_dateTo: string,
  ): Promise<SalestaskEntity> {
    const query = this.salestasksRepository.createQueryBuilder('st');
    query.select(
      'count(case when st.execute_small_result = "SR01" then 1 end) as SR01',
    );
    query.addSelect(
      'count(case when st.execute_small_result = "SR02" then 1 end) as SR02',
    );
    query.addSelect(
      'count(case when st.execute_small_result = "SR03" then 1 end) as SR03',
    );
    query.addSelect(
      'count(case when st.execute_small_result = "SR04" then 1 end) as SR04',
    );
    query.addSelect(
      'count(case when st.execute_small_result = "SR05" then 1 end) as SR05',
    );
    query.addSelect(
      'count(case when st.execute_small_result = "SR06" then 1 end) as SR06',
    );
    query.addSelect(
      'count(case when st.execute_small_result = "SR07" then 1 end) as SR07',
    );
    query.addSelect(
      'count(case when st.execute_small_result = "SR08" then 1 end) as SR08',
    );
    query.addSelect(
      'count(case when st.execute_small_result = "SR09" then 1 end) as SR09',
    );
    query.addSelect(
      'count(case when st.execute_small_result = "SR10" then 1 end) as SR10',
    );
    query.addSelect(
      'count(case when st.execute_small_result = "SR11" then 1 end) as SR11',
    );
    query.addSelect(
      'count(case when st.execute_small_result = "SR12" then 1 end) as SR12',
    );
    query.addSelect(
      'count(case when st.execute_small_result = "SR13" then 1 end) as SR13',
    );
    query.addSelect(
      'count(case when st.execute_small_result = "SR14" then 1 end) as SR14',
    );
    query.addSelect(
      'count(case when st.execute_small_result = "SR15" then 1 end) as SR15',
    );
    query.addSelect(
      'count(case when st.execute_small_result = "SR16" then 1 end) as SR16',
    );
    query.addSelect(
      'count(case when st.execute_small_result = "SR17" then 1 end) as SR17',
    );
    query.addSelect(
      'count(case when st.execute_small_result = "SR18" then 1 end) as SR18',
    );
    query.addSelect(
      'count(case when st.execute_small_result = "SR19" then 1 end) as SR19',
    );
    query.addSelect(
      'count(case when st.execute_small_result = "SR20" then 1 end) as SR20',
    );
    query.addSelect(
      'count(case when st.execute_small_result = "SR21" then 1 end) as SR21',
    );
    query.leftJoin('st.saleslist', 'saleslist');
    if (member_id !== null) {
      query.andWhere('st.member_id IN (:member_id)', {
        member_id: member_id,
      });
    }
    if (sales_list_number !== null) {
      query.andWhere('st.sales_list_number IN (:sales_list_number)', {
        sales_list_number: sales_list_number,
      });
    }
    if (execute_dateFrom !== '' && execute_dateFrom !== null) {
      query.andWhere('st.execute_date >= :execute_dateFrom', {
        execute_dateFrom: execute_dateFrom,
      });
    }
    if (execute_dateTo !== '' && execute_dateTo !== null) {
      query.andWhere('st.execute_date <= :execute_dateTo', {
        execute_dateTo: execute_dateTo,
      });
    }
    query.groupBy('saleslist.sales_list_number');
    const response = query.getRawOne();
    return response;
  }

  async create(salestask: SalesTaskDTO) {
    await this.salestasksRepository.save({
      member_id: salestask.member_id,
      execute_date: salestask.execute_date,
      execute_big_result: salestask.execute_big_result,
      execute_small_result: salestask.execute_small_result,
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
        execute_big_result: salestask.execute_big_result,
        execute_small_result: salestask.execute_small_result,
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

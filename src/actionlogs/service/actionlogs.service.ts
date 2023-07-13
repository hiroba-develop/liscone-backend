import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateActionlogDTO } from '../dto/create-actionlog.dto';
import { UpdateActionlogDTO } from '../dto/update-actionlog.dto';
import { ActionlogEntity } from '../entities/actionlogs.entity';

@Injectable()
export class ActionlogsService {
  constructor(
    @InjectRepository(ActionlogEntity)
    private actionlogsRepository: Repository<ActionlogEntity>,
  ) {}

  findAll(): Promise<ActionlogEntity[]> {
    return this.actionlogsRepository.find({ relations: ['corporationEntity'] });
  }

  findSalesListActionlogs(salesListNumber: string): Promise<ActionlogEntity[]> {
    const query = this.actionlogsRepository.createQueryBuilder('actionlog');
    query.leftJoinAndSelect('actionlog.corporationEntity', 'corporationEntity');
    query.leftJoinAndSelect('actionlog.saleslistEntity', 'saleslistEntity');
    query.leftJoinAndSelect(
      'actionlog.corporationstaffEntity',
      'corporationstaffEntity',
    );
    query.leftJoinAndSelect('actionlog.memberEntity', 'memberEntity');
    query.where('actionlog.sales_list_number = :sales_list_number', {
      sales_list_number: salesListNumber,
    });
    return query.getMany();
  }

  findAllActionlogs(
    createActionlog: CreateActionlogDTO,
  ): Promise<ActionlogEntity[]> {
    const query = this.actionlogsRepository.createQueryBuilder('actionlog');
    query.leftJoinAndSelect('actionlog.corporationEntity', 'corporationEntity');
    query.leftJoinAndSelect('actionlog.saleslistEntity', 'saleslistEntity');
    query.leftJoinAndSelect(
      'actionlog.corporationstaffEntity',
      'corporationstaffEntity',
    );
    query.leftJoinAndSelect('actionlog.memberEntity', 'memberEntity');

    if (typeof createActionlog.task_number !== 'undefined') {
      query.andWhere('task_number = :task_number', {
        task_number: createActionlog.task_number,
      });
    }
    if (typeof createActionlog.member_id !== 'undefined') {
      query.andWhere('actionlog.member_id LIKE :member_id', {
        member_id: `%${createActionlog.member_id}%`,
      });
    }
    if (typeof createActionlog.execute_major_result !== 'undefined') {
      query.andWhere('execute_result LIKE :execute_major_result', {
        execute_major_result: `${createActionlog.execute_major_result}%`,
      });
    }
    if (typeof createActionlog.execute_minor_result !== 'undefined') {
      query.andWhere('execute_result LIKE :execute_minor_result', {
        execute_minor_result: `%${createActionlog.execute_minor_result}`,
      });
    }
    if (
      typeof createActionlog.execute_from_date !== 'undefined' &&
      typeof createActionlog.execute_to_date !== 'undefined'
    ) {
      query.andWhere(
        'execute_date Between :execute_from_date AND :execute_to_date',
        {
          execute_from_date: createActionlog.execute_from_date,
          execute_to_date: createActionlog.execute_to_date,
        },
      );
    }

    // join
    if (typeof createActionlog.corporation_name !== 'undefined') {
      query.andWhere(
        'corporationEntity.corporation_name LIKE :corporation_name',
        { corporation_name: `%${createActionlog.corporation_name}%` },
      );
    }
    if (typeof createActionlog.corporate_number !== 'undefined') {
      query.andWhere(
        'corporationEntity.corporate_number LIKE :corporate_number',
        { corporate_number: `%${createActionlog.corporate_number}%` },
      );
    }
    if (typeof createActionlog.sales_list_name !== 'undefined') {
      query.andWhere('saleslistEntity.sales_list_name LIKE :sales_list_name', {
        sales_list_name: `%${createActionlog.sales_list_name}%`,
      });
    }
    if (typeof createActionlog.staff_name !== 'undefined') {
      query.andWhere('companystaffEntity.staff_name LIKE :staff_name', {
        staff_name: `%${createActionlog.staff_name}%`,
      });
    }
    if (typeof createActionlog.member_name !== 'undefined') {
      query.andWhere('memberEntity.member_name LIKE :member_name', {
        member_name: `%${createActionlog.member_name}%`,
      });
    }
    return query.getMany();
  }

  async create(actionlog: CreateActionlogDTO) {
    await this.actionlogsRepository.save(actionlog);
  }

  async update(actionlog: CreateActionlogDTO) {
    const searchActionlog = new CreateActionlogDTO();
    searchActionlog.task_number = actionlog.task_number;
    searchActionlog.member_id = actionlog.member_id;
    const resultsalestask = await this.findAllActionlogs(searchActionlog);

    if (!resultsalestask) {
      throw new NotFoundException('task_number and member_id is not exist');
    }

    try {
      await this.actionlogsRepository.update(
        {
          task_number: actionlog.task_number,
          member_id: actionlog.member_id,
        },
        {
          sales_list_number: actionlog.sales_list_number,
          task_name: actionlog.task_name,
          sales_corporation_id: actionlog.sales_corporation_id,
          sales_staff_id: actionlog.sales_staff_id,
          deadline: actionlog.deadline,
          execute_date: actionlog.execute_date,
          execute_big_result: actionlog.execute_big_result,
          execute_small_result: actionlog.execute_small_result,
          comment: actionlog.comment,
          status: actionlog.status,
          modified_by: actionlog.modified_by,
        },
      );
      return await this.findAllActionlogs(actionlog);
    } catch (e) {
      console.log(
        'there is no task_number and member_id : ' +
          actionlog.task_number +
          ' and ' +
          actionlog.member_id,
      );
      throw e;
    }
  }

  async remove(actionlog: UpdateActionlogDTO): Promise<void> {
    await this.actionlogsRepository.delete({
      task_number: actionlog.task_number,
      member_id: actionlog.member_id,
    });
  }
}

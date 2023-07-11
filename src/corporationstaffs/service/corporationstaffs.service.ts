import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateCorporationstaffDTO } from '../dto/create-corporationstaff.dto';
import { UpdateCorporationstaffDTO } from '../dto/update-corporationstaff.dto';
import { CorporationstaffEntity } from '../entities/corporationstaffs.entity';
@Injectable()
export class CorporationstaffsService {
  constructor(
    @InjectRepository(CorporationstaffEntity)
    private CorporationstaffsRepository: Repository<CorporationstaffEntity>,
  ) {}

  findAll(): Promise<CorporationstaffEntity[]> {
    return this.CorporationstaffsRepository.find({
      relations: ['corporationEntity'],
    });
  }
  async findStaffsIdNameByCorporation(
    corporation_id: string,
  ): Promise<CorporationstaffEntity[]> {
    return await this.CorporationstaffsRepository.find({
      select: ['staff_id', 'staff_name'],
      where: {
        corporation_id,
      },
    });
  }

  async findStaffsByCorporation(
    corporationId: string,
  ): Promise<CorporationstaffEntity[]> {
    const query =
      this.CorporationstaffsRepository.createQueryBuilder('Corporationstaff');
    query.leftJoinAndSelect(
      'Corporationstaff.corporationEntity',
      'corporationEntity',
    );
    query.where('corporationEntity.corporation_id = ' + corporationId);
    const response = await query.getMany();
    console.log(response);
    return response;
  }

  async findStaffsBySalesList(
    salesListNumber: string,
  ): Promise<CorporationstaffEntity[]> {
    const query =
      this.CorporationstaffsRepository.createQueryBuilder('Corporationstaff');
    query.leftJoinAndSelect(
      'Corporationstaff.salesStaffsList',
      'salesStaffsList',
    );
    query.leftJoinAndSelect(
      'Corporationstaff.corporationEntity',
      'corporationEntity',
    );
    query.where('salesStaffsList.sales_list_number = ' + salesListNumber);
    const response = await query.getMany();
    console.log(response);
    return response;
  }

  findCorporationstaffsById(
    staff_id: string,
  ): Promise<CorporationstaffEntity[]> {
    return this.CorporationstaffsRepository.find({
      where: {
        staff_id,
      },
    });
  }

  findAllCorporationstaffs(
    createCorporationstaff: CreateCorporationstaffDTO,
  ): Promise<CorporationstaffEntity[]> {
    const query =
      this.CorporationstaffsRepository.createQueryBuilder('Corporationstaff');
    query.leftJoinAndSelect(
      'Corporationstaff.corporationEntity',
      'corporationEntity',
    );
    //query.andWhere("corporation_id = :corporation_id1", { corporation_id1: createCorporationstaff.corporation_id});
    if (typeof createCorporationstaff.staff_id !== 'undefined') {
      query.andWhere('staff_id = :staff_id', {
        staff_id: createCorporationstaff.staff_id,
      });
    }
    if (typeof createCorporationstaff.staff_name !== 'undefined') {
      query.andWhere('staff_name LIKE :staff_name', {
        staff_name: `%${createCorporationstaff.staff_name}%`,
      });
    }
    if (typeof createCorporationstaff.job_position !== 'undefined') {
      query.andWhere('job_position = :job_position', {
        job_position: createCorporationstaff.job_position,
      });
    }
    if (typeof createCorporationstaff.profile_source_type !== 'undefined') {
      query.andWhere('profile_source_type = :profile_source_type', {
        profile_source_type: createCorporationstaff.profile_source_type,
      });
    }

    if (
      typeof createCorporationstaff.employee_from_number !== 'undefined' &&
      typeof createCorporationstaff.employee_to_number !== 'undefined'
    ) {
      query.andWhere(
        'corporationEntity.employee_number Between :employee_from_number AND :employee_to_number',
        {
          employee_from_number: createCorporationstaff.employee_from_number,
          employee_to_number: createCorporationstaff.employee_to_number,
        },
      );
    }
    if (typeof createCorporationstaff.corporation_name !== 'undefined') {
      query.andWhere(
        'corporationEntity.corporation_name LIKE :corporation_name ',
        { corporation_name: `%${createCorporationstaff.corporation_name}%` },
      );
    }
    return query.getMany();
  }

  async create(Corporationstaff: CreateCorporationstaffDTO) {
    await this.CorporationstaffsRepository.save(Corporationstaff);
  }

  async update(Corporationstaff: CreateCorporationstaffDTO) {
    const resultsalestask = await this.findAllCorporationstaffs(
      Corporationstaff,
    );
    if (!resultsalestask) {
      throw new NotFoundException('staff_id and corporation_id is not exist');
    }
    try {
      await this.CorporationstaffsRepository.update(
        {
          staff_id: Corporationstaff.staff_id,
          corporation_id: Corporationstaff.corporation_id,
        },
        {
          staff_name: Corporationstaff.staff_name,
          job_position: Corporationstaff.job_position,
          profile_source_type: Corporationstaff.profile_source_type,
          profile_link: Corporationstaff.profile_link,
          other_information: Corporationstaff.other_information,
          modified_by: Corporationstaff.modified_by,
        },
      );
      return await this.findAllCorporationstaffs(Corporationstaff);
    } catch (e) {
      console.log(
        'there is no staff_id and corporation_id : ' +
          Corporationstaff.staff_id +
          ' and ' +
          Corporationstaff.corporation_id,
      );
      throw e;
    }
  }

  async remove(Corporationstaff: UpdateCorporationstaffDTO): Promise<void> {
    await this.CorporationstaffsRepository.delete({
      staff_id: Corporationstaff.staff_id,
      corporation_id: Corporationstaff.corporation_id,
    });
  }
}

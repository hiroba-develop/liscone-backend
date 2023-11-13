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

  findAllCorporationstaffsSearchChick(
    searchCorporationName: string,
    searchJobPosition1: string,
    searchJobPosition2: string,
    searchJobPosition3: string,
    searchJobPosition4: string,
    searchJobPosition5: string,
    searchDepartment1: string,
    searchDepartment2: string,
    searchDepartment3: string,
    searchDepartment4: string,
    searchDepartment5: string,
    searchProfileSourceType: string,
    searchStaffName: string,
  ): Promise<CorporationstaffEntity[]> {
    const query =
      this.CorporationstaffsRepository.createQueryBuilder('Corporationstaff');
    query.leftJoinAndSelect(
      'Corporationstaff.corporationEntity',
      'corporationEntity',
    );
    if (
      searchCorporationName !== undefined &&
      searchCorporationName !== '' &&
      searchCorporationName !== null
    ) {
      query.andWhere(
        'corporationEntity.corporation_name LIKE :searchCorporationName',
        {
          searchCorporationName: `%${searchCorporationName}%`,
        },
      );
    }
    if (
      searchJobPosition5 !== undefined &&
      searchJobPosition5 !== '' &&
      searchJobPosition5 !== null
    ) {
      query.andWhere(
        '(Corporationstaff.job_position LIKE :searchJobPosition1 OR Corporationstaff.job_position LIKE :searchJobPosition2 OR Corporationstaff.job_position LIKE :searchJobPosition3 OR Corporationstaff.job_position LIKE :searchJobPosition4 OR Corporationstaff.job_position LIKE :searchJobPosition5)',
        {
          searchJobPosition1: `%${searchJobPosition1}%`,
          searchJobPosition2: `%${searchJobPosition2}%`,
          searchJobPosition3: `%${searchJobPosition3}%`,
          searchJobPosition4: `%${searchJobPosition4}%`,
          searchJobPosition5: `%${searchJobPosition5}%`,
        },
      );
    } else if (
      searchJobPosition4 !== undefined &&
      searchJobPosition4 !== '' &&
      searchJobPosition4 !== null
    ) {
      query.andWhere(
        '(Corporationstaff.job_position LIKE :searchJobPosition1 OR Corporationstaff.job_position LIKE :searchJobPosition2 OR Corporationstaff.job_position LIKE :searchJobPosition3 OR Corporationstaff.job_position LIKE :searchJobPosition4 )',
        {
          searchJobPosition1: `%${searchJobPosition1}%`,
          searchJobPosition2: `%${searchJobPosition2}%`,
          searchJobPosition3: `%${searchJobPosition3}%`,
          searchJobPosition4: `%${searchJobPosition4}%`,
        },
      );
    } else if (
      searchJobPosition3 !== undefined &&
      searchJobPosition3 !== '' &&
      searchJobPosition3 !== null
    ) {
      query.andWhere(
        '(Corporationstaff.job_position LIKE :searchJobPosition1 OR Corporationstaff.job_position LIKE :searchJobPosition2 OR Corporationstaff.job_position LIKE :searchJobPosition3)',
        {
          searchJobPosition1: `%${searchJobPosition1}%`,
          searchJobPosition2: `%${searchJobPosition2}%`,
          searchJobPosition3: `%${searchJobPosition3}%`,
        },
      );
    } else if (
      searchJobPosition2 !== undefined &&
      searchJobPosition2 !== '' &&
      searchJobPosition2 !== null
    ) {
      query.andWhere(
        '(Corporationstaff.job_position LIKE :searchJobPosition1 OR Corporationstaff.job_position LIKE :searchJobPosition2 )',
        {
          searchJobPosition1: `%${searchJobPosition1}%`,
          searchJobPosition2: `%${searchJobPosition2}%`,
        },
      );
    } else if (
      searchJobPosition1 !== undefined &&
      searchJobPosition1 !== '' &&
      searchJobPosition1 !== null
    ) {
      query.andWhere('Corporationstaff.job_position LIKE :searchJobPosition1', {
        searchJobPosition1: `%${searchJobPosition1}%`,
      });
    }

    if (
      searchDepartment5 !== undefined &&
      searchDepartment5 !== '' &&
      searchDepartment5 !== null
    ) {
      query.andWhere(
        '(Corporationstaff.job_position LIKE :searchDepartment1 OR Corporationstaff.job_position LIKE :searchDepartment2 OR Corporationstaff.job_position LIKE :searchDepartment3 OR Corporationstaff.job_position LIKE :searchDepartment4 OR Corporationstaff.job_position LIKE :searchDepartment5)',
        {
          searchDepartment1: `%${searchDepartment1}%`,
          searchDepartment2: `%${searchDepartment2}%`,
          searchDepartment3: `%${searchDepartment3}%`,
          searchDepartment4: `%${searchDepartment4}%`,
          searchDepartment5: `%${searchDepartment5}%`,
        },
      );
    } else if (
      searchDepartment4 !== undefined &&
      searchDepartment4 !== '' &&
      searchDepartment4 !== null
    ) {
      query.andWhere(
        '(Corporationstaff.job_position LIKE :searchDepartment1 OR Corporationstaff.job_position LIKE :searchDepartment2 OR Corporationstaff.job_position LIKE :searchDepartment3 OR Corporationstaff.job_position LIKE :searchDepartment4 )',
        {
          searchDepartment1: `%${searchDepartment1}%`,
          searchDepartment2: `%${searchDepartment2}%`,
          searchDepartment3: `%${searchDepartment3}%`,
          searchDepartment4: `%${searchDepartment4}%`,
        },
      );
    } else if (
      searchDepartment3 !== undefined &&
      searchDepartment3 !== '' &&
      searchDepartment3 !== null
    ) {
      query.andWhere(
        '(Corporationstaff.job_position LIKE :searchDepartment1 OR Corporationstaff.job_position LIKE :searchDepartment2 OR Corporationstaff.job_position LIKE :searchDepartment3)',
        {
          searchDepartment1: `%${searchDepartment1}%`,
          searchDepartment2: `%${searchDepartment2}%`,
          searchDepartment3: `%${searchDepartment3}%`,
        },
      );
    } else if (
      searchDepartment2 !== undefined &&
      searchDepartment2 !== '' &&
      searchDepartment2 !== null
    ) {
      query.andWhere(
        '(Corporationstaff.job_position LIKE :searchDepartment1 OR Corporationstaff.job_position LIKE :searchDepartment2)',
        {
          searchDepartment1: `%${searchDepartment1}%`,
          searchDepartment2: `%${searchDepartment2}%`,
        },
      );
    } else if (
      searchDepartment1 !== undefined &&
      searchDepartment1 !== '' &&
      searchDepartment1 !== null
    ) {
      query.andWhere('Corporationstaff.job_position LIKE :searchDepartment1', {
        searchDepartment1: `%${searchDepartment1}%`,
      });
    }

    if (
      searchProfileSourceType !== undefined &&
      searchProfileSourceType !== '' &&
      searchProfileSourceType !== null
    ) {
      query.andWhere(
        'Corporationstaff.profile_source_type = :searchProfileSourceType',
        {
          searchProfileSourceType: searchProfileSourceType,
        },
      );
    }
    if (
      searchStaffName !== undefined &&
      searchStaffName !== '' &&
      searchStaffName !== null
    ) {
      query.andWhere('Corporationstaff.staff_name = :searchStaffName', {
        searchStaffName: searchStaffName,
      });
    }
    return query.getMany();
  }

  findAllCorporationstaffsSearchChickCount(
    searchCorporationName: string,
    searchJobPosition1: string,
    searchJobPosition2: string,
    searchJobPosition3: string,
    searchJobPosition4: string,
    searchJobPosition5: string,
    searchDepartment1: string,
    searchDepartment2: string,
    searchDepartment3: string,
    searchDepartment4: string,
    searchDepartment5: string,
    searchProfileSourceType: string,
    searchStaffName: string,
  ): Promise<number> {
    const query =
      this.CorporationstaffsRepository.createQueryBuilder('Corporationstaff');
    query.leftJoinAndSelect(
      'Corporationstaff.corporationEntity',
      'corporationEntity',
    );
    if (
      searchCorporationName !== undefined &&
      searchCorporationName !== '' &&
      searchCorporationName !== null
    ) {
      query.andWhere(
        'corporationEntity.corporation_name LIKE :searchCorporationName',
        {
          searchCorporationName: `%${searchCorporationName}%`,
        },
      );
    }
    if (
      searchJobPosition5 !== undefined &&
      searchJobPosition5 !== '' &&
      searchJobPosition5 !== null
    ) {
      query.andWhere(
        '(Corporationstaff.job_position LIKE :searchJobPosition1 OR Corporationstaff.job_position LIKE :searchJobPosition2 OR Corporationstaff.job_position LIKE :searchJobPosition3 OR Corporationstaff.job_position LIKE :searchJobPosition4 OR Corporationstaff.job_position LIKE :searchJobPosition5)',
        {
          searchJobPosition1: `%${searchJobPosition1}%`,
          searchJobPosition2: `%${searchJobPosition2}%`,
          searchJobPosition3: `%${searchJobPosition3}%`,
          searchJobPosition4: `%${searchJobPosition4}%`,
          searchJobPosition5: `%${searchJobPosition5}%`,
        },
      );
    } else if (
      searchJobPosition4 !== undefined &&
      searchJobPosition4 !== '' &&
      searchJobPosition4 !== null
    ) {
      query.andWhere(
        '(Corporationstaff.job_position LIKE :searchJobPosition1 OR Corporationstaff.job_position LIKE :searchJobPosition2 OR Corporationstaff.job_position LIKE :searchJobPosition3 OR Corporationstaff.job_position LIKE :searchJobPosition4 )',
        {
          searchJobPosition1: `%${searchJobPosition1}%`,
          searchJobPosition2: `%${searchJobPosition2}%`,
          searchJobPosition3: `%${searchJobPosition3}%`,
          searchJobPosition4: `%${searchJobPosition4}%`,
        },
      );
    } else if (
      searchJobPosition3 !== undefined &&
      searchJobPosition3 !== '' &&
      searchJobPosition3 !== null
    ) {
      query.andWhere(
        '(Corporationstaff.job_position LIKE :searchJobPosition1 OR Corporationstaff.job_position LIKE :searchJobPosition2 OR Corporationstaff.job_position LIKE :searchJobPosition3)',
        {
          searchJobPosition1: `%${searchJobPosition1}%`,
          searchJobPosition2: `%${searchJobPosition2}%`,
          searchJobPosition3: `%${searchJobPosition3}%`,
        },
      );
    } else if (
      searchJobPosition2 !== undefined &&
      searchJobPosition2 !== '' &&
      searchJobPosition2 !== null
    ) {
      query.andWhere(
        '(Corporationstaff.job_position LIKE :searchJobPosition1 OR Corporationstaff.job_position LIKE :searchJobPosition2 )',
        {
          searchJobPosition1: `%${searchJobPosition1}%`,
          searchJobPosition2: `%${searchJobPosition2}%`,
        },
      );
    } else if (
      searchJobPosition1 !== undefined &&
      searchJobPosition1 !== '' &&
      searchJobPosition1 !== null
    ) {
      query.andWhere('Corporationstaff.job_position LIKE :searchJobPosition1', {
        searchJobPosition1: `%${searchJobPosition1}%`,
      });
    }

    if (
      searchDepartment5 !== undefined &&
      searchDepartment5 !== '' &&
      searchDepartment5 !== null
    ) {
      query.andWhere(
        '(Corporationstaff.job_position LIKE :searchDepartment1 OR Corporationstaff.job_position LIKE :searchDepartment2 OR Corporationstaff.job_position LIKE :searchDepartment3 OR Corporationstaff.job_position LIKE :searchDepartment4 OR Corporationstaff.job_position LIKE :searchDepartment5)',
        {
          searchDepartment1: `%${searchDepartment1}%`,
          searchDepartment2: `%${searchDepartment2}%`,
          searchDepartment3: `%${searchDepartment3}%`,
          searchDepartment4: `%${searchDepartment4}%`,
          searchDepartment5: `%${searchDepartment5}%`,
        },
      );
    } else if (
      searchDepartment4 !== undefined &&
      searchDepartment4 !== '' &&
      searchDepartment4 !== null
    ) {
      query.andWhere(
        '(Corporationstaff.job_position LIKE :searchDepartment1 OR Corporationstaff.job_position LIKE :searchDepartment2 OR Corporationstaff.job_position LIKE :searchDepartment3 OR Corporationstaff.job_position LIKE :searchDepartment4 )',
        {
          searchDepartment1: `%${searchDepartment1}%`,
          searchDepartment2: `%${searchDepartment2}%`,
          searchDepartment3: `%${searchDepartment3}%`,
          searchDepartment4: `%${searchDepartment4}%`,
        },
      );
    } else if (
      searchDepartment3 !== undefined &&
      searchDepartment3 !== '' &&
      searchDepartment3 !== null
    ) {
      query.andWhere(
        '(Corporationstaff.job_position LIKE :searchDepartment1 OR Corporationstaff.job_position LIKE :searchDepartment2 OR Corporationstaff.job_position LIKE :searchDepartment3)',
        {
          searchDepartment1: `%${searchDepartment1}%`,
          searchDepartment2: `%${searchDepartment2}%`,
          searchDepartment3: `%${searchDepartment3}%`,
        },
      );
    } else if (
      searchDepartment2 !== undefined &&
      searchDepartment2 !== '' &&
      searchDepartment2 !== null
    ) {
      query.andWhere(
        '(Corporationstaff.job_position LIKE :searchDepartment1 OR Corporationstaff.job_position LIKE :searchDepartment2)',
        {
          searchDepartment1: `%${searchDepartment1}%`,
          searchDepartment2: `%${searchDepartment2}%`,
        },
      );
    } else if (
      searchDepartment1 !== undefined &&
      searchDepartment1 !== '' &&
      searchDepartment1 !== null
    ) {
      query.andWhere('Corporationstaff.job_position LIKE :searchDepartment1', {
        searchDepartment1: `%${searchDepartment1}%`,
      });
    }

    if (
      searchProfileSourceType !== undefined &&
      searchProfileSourceType !== '' &&
      searchProfileSourceType !== null
    ) {
      query.andWhere(
        'Corporationstaff.profile_source_type = :searchProfileSourceType',
        {
          searchProfileSourceType: searchProfileSourceType,
        },
      );
    }
    if (
      searchStaffName !== undefined &&
      searchStaffName !== '' &&
      searchStaffName !== null
    ) {
      query.andWhere('Corporationstaff.staff_name = :searchStaffName', {
        searchStaffName: searchStaffName,
      });
    }
    return query.getCount();
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

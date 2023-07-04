import {
  Inject,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, Like, LessThan, MoreThan } from 'typeorm';
import { CreateCompanystaffDTO } from '../dto/create-companystaff.dto';
import { UpdateCompanystaffDTO } from '../dto/update-companystaff.dto';
import { CompanystaffEntity } from '../entities/companystaffs.entity';
import { CorporationEntity } from '../../corporations/entities/corporations.entity';
@Injectable()
export class CompanystaffsService {
  constructor(
    @InjectRepository(CompanystaffEntity)
    private companystaffsRepository: Repository<CompanystaffEntity>,
  ) {}

  findAll(): Promise<CompanystaffEntity[]> {
    return this.companystaffsRepository.find({
      relations: ['corporationEntity'],
    });
  }

  findAllCompanystaffs(
    createCompanystaff: CreateCompanystaffDTO,
  ): Promise<CompanystaffEntity[]> {
    const query =
      this.companystaffsRepository.createQueryBuilder('companystaff');
    query.leftJoinAndSelect(
      'companystaff.corporationEntity',
      'corporationEntity',
    );
    //query.andWhere("corporation_id = :corporation_id1", { corporation_id1: createCompanystaff.corporation_id});
    if (typeof createCompanystaff.staff_id !== 'undefined') {
      query.andWhere('staff_id = :staff_id', {
        staff_id: createCompanystaff.staff_id,
      });
    }
    if (typeof createCompanystaff.staff_name !== 'undefined') {
      query.andWhere('staff_name LIKE :staff_name', {
        staff_name: `%${createCompanystaff.staff_name}%`,
      });
    }
    if (typeof createCompanystaff.job_position !== 'undefined') {
      query.andWhere('job_position = :job_position', {
        job_position: createCompanystaff.job_position,
      });
    }
    if (typeof createCompanystaff.profile_source_type !== 'undefined') {
      query.andWhere('profile_source_type = :profile_source_type', {
        profile_source_type: createCompanystaff.profile_source_type,
      });
    }

    if (
      typeof createCompanystaff.employee_from_number !== 'undefined' &&
      typeof createCompanystaff.employee_to_number !== 'undefined'
    ) {
      query.andWhere(
        'corporationEntity.employee_number Between :employee_from_number AND :employee_to_number',
        {
          employee_from_number: createCompanystaff.employee_from_number,
          employee_to_number: createCompanystaff.employee_to_number,
        },
      );
    }
    if (typeof createCompanystaff.corporation_name !== 'undefined') {
      query.andWhere(
        'corporationEntity.corporation_name LIKE :corporation_name ',
        { corporation_name: `%${createCompanystaff.corporation_name}%` },
      );
    }
    return query.getMany();
  }

  async create(companystaff: CreateCompanystaffDTO) {
    await this.companystaffsRepository.save(companystaff);
  }

  async update(companystaff: CreateCompanystaffDTO) {
    const resultsalestask = await this.findAllCompanystaffs(companystaff);
    if (!resultsalestask) {
      throw new NotFoundException('staff_id and corporation_id is not exist');
    }
    try {
      await this.companystaffsRepository.update(
        {
          staff_id: companystaff.staff_id,
          corporation_id: companystaff.corporation_id,
        },
        {
          staff_name: companystaff.staff_name,
          job_position: companystaff.job_position,
          profile_source_type: companystaff.profile_source_type,
          profile_link: companystaff.profile_link,
          other_information: companystaff.other_information,
          modified_by: companystaff.modified_by,
        },
      );
      return await this.findAllCompanystaffs(companystaff);
    } catch (e) {
      console.log(
        'there is no staff_id and corporation_id : ' +
          companystaff.staff_id +
          ' and ' +
          companystaff.corporation_id,
      );
      throw e;
    }
  }

  async remove(companystaff: UpdateCompanystaffDTO): Promise<void> {
    await this.companystaffsRepository.delete({
      staff_id: companystaff.staff_id,
      corporation_id: companystaff.corporation_id,
    });
  }
}

import {
  Inject,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateRecruitDTO } from '../dto/create-recruit.dto';
import { RecruitEntity } from '../entities/recruit.entity';
import { UpdateRecruitDTO } from '../dto/update-recruit.dto';

@Injectable()
export class RecruitService {
  constructor(
    @InjectRepository(RecruitEntity)
    private recruitsRepository: Repository<RecruitEntity>,
  ) {}

  findAll(): Promise<RecruitEntity[]> {
    return this.recruitsRepository.find();
  }

  findByRecruitResultCount(
    dto: CreateRecruitDTO,
    searchRecruitBigResult: string,
    searchRecruitMiddleResult: string,
    searchRecruitSmallResult: string,
  ): Promise<RecruitEntity[]> {
    let query = this.recruitsRepository.createQueryBuilder('tb_recruit');
    query.select("corporation_id");
    // 大項目
    if (searchRecruitBigResult !== '' && searchRecruitBigResult !== undefined) {
      query.andWhere('recruit_large_category = :searchRecruitBigResult', {
        recruit_large_category: dto.recruit_large_category,
        searchRecruitBigResult: searchRecruitBigResult,
      });
    }
    // 中項目
    if (searchRecruitMiddleResult !== '' && searchRecruitMiddleResult !== undefined) {
      query.andWhere('recruit_middle_category = :searchRecruitMiddleResult', {
        recruit_middle_category: dto.recruit_middle_category,
        searchRecruitMiddleResult: searchRecruitMiddleResult,
      });
    }
    // 小項目
    if (searchRecruitSmallResult !== '' && searchRecruitSmallResult !== undefined) {
      query.andWhere('recruit_small_category = :searchRecruitSmallResult', {
        recruit_small_category: dto.recruit_small_category,
        searchRecruitSmallResult: searchRecruitSmallResult,
      });
    }
    const response = query.getRawMany();
    console.log(response);
    return response;
  }

  findByRecruitResult(
    dto: CreateRecruitDTO,
    searchRecruitBigResult: string,
    searchRecruitMiddleResult: string,
    searchRecruitSmallResult: string,
  ): Promise<RecruitEntity[]> {
    console.log(searchRecruitMiddleResult)
    let query = this.recruitsRepository.createQueryBuilder('tb_recruit');
    query.innerJoinAndSelect('tb_recruit.corporationEntity', 'corporationEntity');
    // 大項目
    if (searchRecruitBigResult !== '' && searchRecruitBigResult !== undefined) {
      query.andWhere('recruit_large_category = :searchRecruitBigResult', {
        recruit_large_category: dto.recruit_large_category,
        searchRecruitBigResult: searchRecruitBigResult,
      });
    }
    // 中項目
    if (searchRecruitMiddleResult !== '' && searchRecruitMiddleResult !== undefined) {
      query.andWhere('recruit_middle_category = :searchRecruitMiddleResult', {
        recruit_middle_category: dto.recruit_middle_category,
        searchRecruitMiddleResult: searchRecruitMiddleResult,
      });
    }
    // 小項目
    if (searchRecruitSmallResult !== '' && searchRecruitSmallResult !== undefined) {
      query.andWhere('recruit_small_category = :searchRecruitSmallResult', {
        recruit_small_category: dto.recruit_small_category,
        searchRecruitSmallResult: searchRecruitSmallResult,
      });
    }
    const response = query.getMany();
    console.log(response);
    return response;
  }

  findByCorporationNumber(
    dto: CreateRecruitDTO,
    corporationId: string,
  ): Promise<RecruitEntity[]> {
    let query = this.recruitsRepository.createQueryBuilder('tb_recruit');
    // 法人番号
    if (corporationId !== '') {
      query.andWhere('corporation_id = :corporationId', {
        corporation_id: dto.corporation_id,
        corporationId: corporationId,
      });
    }
    const response = query.getMany();
    console.log(response);
    return response;
  }

  findBySalesCorporationstaffId(recruit_id: string): Promise<RecruitEntity> {
    return this.recruitsRepository.findOne({
      where: {
        recruit_id,
      },
    });
  }

  async create(recruit: CreateRecruitDTO) {
    await this.recruitsRepository.save(recruit);
  }

  async update(recruit: UpdateRecruitDTO) {
    const resultstaff = await this.findBySalesCorporationstaffId(
      recruit.recruit_id,
    );
    if (!resultstaff) {
      throw new NotFoundException('staff id is not exist');
    }
    try {
      await this.recruitsRepository.update(recruit.recruit_id, {
        recruit_id: recruit.recruit_id,
        corporation_id: recruit.corporation_id,
        recruit_large_category: recruit.recruit_large_category,
        recruit_middle_category: recruit.recruit_middle_category,
        recruit_small_category: recruit.recruit_small_category,
        created_by: recruit.created_by,
        modified_by: recruit.modified_by,
      });
      return await this.findBySalesCorporationstaffId(recruit.recruit_id);
    } catch (e) {
      console.log('there is no corporation having id : ' + recruit.recruit_id);
      throw e;
    }
  }

  async remove(id: string): Promise<void> {
    await this.recruitsRepository.delete(id);
  }
}

import {
  Injectable,
  NotAcceptableException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateSaleslistDTO } from '../dto/create-saleslist.dto';
import { UpdateSaleslistDTO } from '../dto/update-saleslist.dto';
import { SalesListCorporations } from '../entities/salesListcorporationsview.entity';
import { SalesListcorporationDetail } from '../entities/salesListcorporationDetail.entity';
import { SalesCorporaitonsListEntity } from '../entities/salescorporationslists.entity';
import { SaleslistEntity } from '../entities/saleslists.entity';
import { SalesStaffsListEntity } from '../entities/salesstaffslists.entity';
import { SalesListStatistics } from '../entities/salesListView.entity';
import { SalesListProceed } from '../entities/salesListProceedView.entity';

@Injectable()
export class SaleslistsService {
  private dataCount: number;
  constructor(
    @InjectRepository(SaleslistEntity)
    private saleslistsRepository: Repository<SaleslistEntity>,

    @InjectRepository(SalesCorporaitonsListEntity)
    private salescorporationslistsRepository: Repository<SalesCorporaitonsListEntity>,

    @InjectRepository(SalesStaffsListEntity)
    private salesstaffslistsRepository: Repository<SalesStaffsListEntity>,

    @InjectRepository(SalesListStatistics)
    private salesListViewRepository: Repository<SalesListStatistics>,

    @InjectRepository(SalesListCorporations)
    private salesListCorporationsRepository: Repository<SalesListCorporations>,

    @InjectRepository(SalesListcorporationDetail)
    private salesListcorporationDetailRepository: Repository<SalesListcorporationDetail>,

    @InjectRepository(SalesListProceed)
    private salesListProceedRepository: Repository<SalesListProceed>,
  ) {
    this.dataCount;
  }

  findAll(): Promise<SaleslistEntity[]> {
    return this.saleslistsRepository.find({
      order: {
        created: 'DESC',
      },
    });
  }

  findByCompanyCode(companyCode: string): Promise<SaleslistEntity[]> {
    const query = this.saleslistsRepository.createQueryBuilder('saleslists');
    query.innerJoinAndSelect('saleslists.memberEntity', 'memberEntity');

    if (companyCode !== '') {
      query.andWhere('memberEntity.company_code = :companyCode', {
        companyCode: companyCode,
      });
    }
    return query.getMany();
  }

  async findBySaleslistMemberId(member_id: string): Promise<SaleslistEntity[]> {
    const response = await this.saleslistsRepository.find({
      select: [
        'sales_list_number',
        'sales_list_name',
        'sales_list_type',
        'sales_product_number',
      ],
      relations: ['memberEntity'],
      where: {
        member_id,
      },
      order: {
        created: 'DESC',
      },
    });
    console.log(response);
    return response;
  }

  async getSaleslistStatistic(member_id): Promise<SalesListStatistics[]> {
    return this.salesListViewRepository.find({
      where: {
        member_id,
      },
      order: {
        created: 'DESC',
      },
    });
  }

  async findBySaleslistNnmber(listNum: number): Promise<SaleslistEntity[]> {
    const response = await this.saleslistsRepository.find({
      select: [
        'sales_list_number',
        'sales_list_name',
        'sales_list_type',
        'sales_product_number',
      ],
      where: {
        sales_list_number: listNum,
      },
    });
    console.log(response);
    return response;
  }

  async findSaleslistCorporations(
    sales_list_number: number,
  ): Promise<SalesListCorporations[]> {
    const response = this.salesListCorporationsRepository.find({
      where: {
        sales_list_number: sales_list_number,
      },
    });
    console.log(response);
    return response;
  }

  async findSaleslistCorporationsDetail(
    sales_list_number: number,
  ): Promise<SalesListcorporationDetail[]> {
    const query =
      this.salesListcorporationDetailRepository.createQueryBuilder(
        'saleslists',
      );
    query.innerJoinAndSelect(
      'saleslists.corporationEntity',
      'corporationEntity',
    );
    query.innerJoinAndSelect('saleslists.saleslistEntity', 'saleslistEntity');

    if (sales_list_number !== null) {
      query.andWhere('saleslists.sales_list_number = :salesListNumber', {
        salesListNumber: sales_list_number,
      });
    }
    return query.getMany();
  }

  async getSaleslistProceed(
    member_id: [],
    sales_list_number: [],
    created_dateFrom: string,
    created_dateTo: string,
  ): Promise<SalesListProceed> {
    const query =
      this.salesListProceedRepository.createQueryBuilder('saleslistproceed');
    query.select('sum(saleslistproceed.listCount)', 'listCount');
    query.addSelect('sum(saleslistproceed.proceedCount)', 'proceedCount');
    if (member_id !== null) {
      query.andWhere('member_id IN (:member_id)', {
        member_id: member_id,
      });
    }
    if (sales_list_number !== null) {
      query.andWhere('sales_list_number IN (:sales_list_number)', {
        sales_list_number: sales_list_number,
      });
    }
    if (created_dateFrom !== '' && created_dateFrom !== null) {
      query.andWhere('created >= :created_dateFrom', {
        created_dateFrom: created_dateFrom,
      });
    }
    if (created_dateTo !== '' && created_dateTo !== null) {
      query.andWhere('created <= :created_dateTo', {
        created_dateTo: created_dateTo,
      });
    }
    return query.getRawOne();
  }

  async findSaleslistStaff(
    sales_list_number: number,
  ): Promise<SaleslistEntity[]> {
    const query = this.saleslistsRepository.createQueryBuilder('saleslist');
    query.leftJoinAndSelect('saleslist.salesStaffs', 'salesStaffs');
    query.leftJoinAndSelect('salesStaffs.corporation', 'corporation');
    query.leftJoinAndSelect('salesStaffs.staff', 'staff');
    query.where('saleslist.sales_list_number = :sales_list_number', {
      sales_list_number: sales_list_number,
    });
    const response = await query.getRawMany();

    console.log(response);
    return response;
  }

  findSalesCorporationInfo(
    sales_list_number: number,
    corporation_id: string,
  ): Promise<SalesCorporaitonsListEntity> {
    return this.salescorporationslistsRepository.findOne({
      where: {
        sales_list_number,
        corporation_id,
      },
    });
  }

  findBySaleslistName(sales_list_name: string): Promise<SaleslistEntity> {
    return this.saleslistsRepository.findOne({
      where: {
        sales_list_name,
      },
    });
  }

  findBySaleslistNumber(salesListNumber: number): Promise<SaleslistEntity> {
    const query = this.saleslistsRepository.createQueryBuilder('saleslist');
    query.where('saleslist.sales_list_number = :salesListNumber', {
      salesListNumber: salesListNumber,
    });
    return query.getRawOne();
  }

  async create(saleslist: CreateSaleslistDTO): Promise<SaleslistEntity> {
    const resultsaleslist = await this.findBySaleslistName(
      saleslist.sales_list_name,
    );
    if (resultsaleslist) {
      throw new NotAcceptableException(
        '同じ名前のリストを登録することはできません。リスト名変えてください。',
      );
    }
    return await this.saleslistsRepository.save(saleslist);
  }

  async createsalescorporations(
    corporationId: string,
    saleslist: SaleslistEntity,
  ) {
    const salescorporationslist = new SalesCorporaitonsListEntity();
    salescorporationslist.sales_list_number = saleslist.sales_list_number;
    salescorporationslist.corporation_id = corporationId;
    await this.salescorporationslistsRepository.save(salescorporationslist);
  }

  async createsalesstaffs(
    staffId: string,
    corporationId: string,
    saleslist: SaleslistEntity,
  ) {
    const salescstaffslist = new SalesStaffsListEntity();
    salescstaffslist.sales_list_number = saleslist.sales_list_number;
    salescstaffslist.staff_id = staffId;
    salescstaffslist.corporation_id = corporationId;
    await this.salesstaffslistsRepository.save(salescstaffslist);
  }

  async update(saleslist: UpdateSaleslistDTO) {
    const resultsaleslist = await this.findBySaleslistNumber(
      saleslist.sales_list_number,
    );
    if (!resultsaleslist) {
      throw new NotFoundException('sales_list_number is not exist');
    }
    try {
      await this.saleslistsRepository.update(saleslist.sales_list_number, {
        member_id: saleslist.member_id,
        sales_list_name: saleslist.sales_list_name,
        sales_list_type: saleslist.sales_list_type,
        sales_product_number: saleslist.sales_product_number,
        created_by: saleslist.created_by,
        modified_by: saleslist.modified_by,
      });
      return await this.findBySaleslistNumber(saleslist.sales_list_number);
    } catch (e) {
      console.log(
        'there is no sales_list_number : ' + saleslist.sales_list_number,
      );
      throw e;
    }
  }

  async updateCorpTranStatus(
    transactionStatus: string,
    saleListNum: number,
    corporationId: string,
  ) {
    await this.salescorporationslistsRepository.update(
      {
        sales_list_number: saleListNum,
        corporation_id: corporationId,
      },
      {
        transaction_status: transactionStatus,
      },
    );
    return this.findBySaleslistNumber(saleListNum);
  }

  async updateCorpMemo(
    memo: string,
    saleListNum: number,
    corporationId: string,
  ) {
    await this.salescorporationslistsRepository.update(
      {
        sales_list_number: saleListNum,
        corporation_id: corporationId,
      },
      {
        memo: memo,
      },
    );
    return this.findBySaleslistNumber(saleListNum);
  }

  async remove(sales_list_number: string): Promise<void> {
    await this.saleslistsRepository.delete(sales_list_number);
  }

  async updateStaffTranStatus(
    transactionStatus: string,
    saleListNum: number,
    corporationId: string,
    staffId: string,
  ) {
    await this.salesstaffslistsRepository.update(
      {
        sales_list_number: saleListNum,
        corporation_id: corporationId,
        staff_id: staffId,
      },
      {
        transaction_status: transactionStatus,
      },
    );
    return this.findBySaleslistNumber(saleListNum);
  }

  async updateStaffMemo(
    memo: string,
    saleListNum: number,
    corporationId: string,
    staffId: string,
  ) {
    await this.salesstaffslistsRepository.update(
      {
        sales_list_number: saleListNum,
        corporation_id: corporationId,
        staff_id: staffId,
      },
      {
        memo: memo,
      },
    );
    return this.findBySaleslistNumber(saleListNum);
  }
}

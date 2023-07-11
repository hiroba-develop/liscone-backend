import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateSaleslistDTO } from '../dto/create-saleslist.dto';
import { UpdateSaleslistDTO } from '../dto/update-saleslist.dto';
import { SalesCorporaitonsListEntity } from '../entities/salescorporationslists.entity';
import { SaleslistEntity } from '../entities/saleslists.entity';
import { SalesStaffsListEntity } from '../entities/salesstaffslists.entity';
import { CreateSalesCorporationsListDTO } from '../dto/create-salescorporationslist.dto';

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
  ) {
    this.dataCount;
  }

  findAll(): Promise<SaleslistEntity[]> {
    return this.saleslistsRepository.find();
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
    });
    console.log(response);
    return response;
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
    sales_list_type: string,
  ): Promise<SaleslistEntity> {
    const query = this.saleslistsRepository.createQueryBuilder('saleslist');
    if (sales_list_type === '01') {
      query.leftJoinAndSelect(
        'saleslist.salesCorporations',
        'salesCorporations',
      );
      query.leftJoinAndSelect('salesCorporations.corporation', 'corporation');
    } else if (sales_list_type === '02') {
      query.leftJoinAndSelect('saleslist.salesStaffs', 'salesStaffs');
      query.leftJoinAndSelect('salesStaffs.corporation', 'corporation');
    }
    query.where('saleslist.sales_list_number = :sales_list_number', {
      sales_list_number: sales_list_number,
    });
    if (sales_list_type === '02') {
      query.groupBy('saleslist.sales_list_number,salesStaffs.corporation_id');
    }

    const response = await query.getOne();

    console.log(response);
    return response;
  }

  async findSaleslistStaff(
    sales_list_number: number,
    sales_list_type: string,
  ): Promise<SaleslistEntity> {
    const query = this.saleslistsRepository.createQueryBuilder('saleslist');
    if (sales_list_type === '01') {
      query.leftJoinAndSelect(
        'saleslist.salesCorporations',
        'salesCorporations',
      );
      query.leftJoinAndSelect('salesCorporations.corporation', 'corporation');
    } else if (sales_list_type === '02') {
      query.leftJoinAndSelect('saleslist.salesStaffs', 'salesStaffs');
      query.leftJoinAndSelect('salesStaffs.corporation', 'corporation');
    }
    query.where('saleslist.sales_list_number = :sales_list_number', {
      sales_list_number: sales_list_number,
    });
    if (sales_list_type === '02') {
      query.groupBy('saleslist.sales_list_number,salesStaffs.corporation_id');
    }

    const response = await query.getOne();

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

  findBySaleslistNumber(sales_list_number: number): Promise<SaleslistEntity> {
    return this.saleslistsRepository.findOne({
      where: {
        sales_list_number,
      },
    });
  }

  async create(saleslist: CreateSaleslistDTO): Promise<SaleslistEntity> {
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

  async updateTranStatus(
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

  async updateMemo(memo: string, saleListNum: number, corporationId: string) {
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
}

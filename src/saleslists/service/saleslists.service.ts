import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateSaleslistDTO } from '../dto/create-saleslist.dto';
import { UpdateSaleslistDTO } from '../dto/update-saleslist.dto';
import { SalesCorporaitonsListEntity } from '../entities/salescorporationslists.entity';
import { SaleslistEntity } from '../entities/saleslists.entity';
import { SalesStaffsListEntity } from '../entities/salesstaffslists.entity';

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

  findBySaleslistMemberId(member_id: string): Promise<SaleslistEntity> {
    return this.saleslistsRepository.findOne({
      where: {
        member_id,
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
  count() {
    return this.saleslistsRepository.count();
  }

  async create(saleslist: CreateSaleslistDTO): Promise<SaleslistEntity> {
    return await this.saleslistsRepository.save(saleslist);
  }

  async createsalescorporations(companyId: string, saleslist: SaleslistEntity) {
    const salescorporationslist = new SalesCorporaitonsListEntity();
    salescorporationslist.sales_list_number = saleslist.sales_list_number;
    salescorporationslist.company_id = companyId;
    await this.salescorporationslistsRepository.save(salescorporationslist);
  }

  async createsalesstaffs(
    staffId: string,
    companyId: string,
    saleslist: SaleslistEntity,
  ) {
    const salescstaffslist = new SalesStaffsListEntity();
    salescstaffslist.sales_list_number = saleslist.sales_list_number;
    salescstaffslist.staff_id = staffId;
    salescstaffslist.corporation_id = companyId;
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

  async remove(sales_list_number: string): Promise<void> {
    await this.saleslistsRepository.delete(sales_list_number);
  }
}

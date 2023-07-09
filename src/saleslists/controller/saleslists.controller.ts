import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
} from '@nestjs/common';
import { CreateSaleslistDTO } from '../dto/create-saleslist.dto';
import { UpdateSaleslistDTO } from '../dto/update-saleslist.dto';
import { SaleslistEntity } from '../entities/saleslists.entity';
import { SaleslistsService } from '../service/saleslists.service';
import { CreateSalesCorporationsListDTO } from '../dto/create-salescorporationslist.dto';
@Controller('saleslists')
export class SaleslistsController {
  private dataCount: number;
  constructor(private readonly saleslistsService: SaleslistsService) {}

  @Get()
  getAll(): Promise<SaleslistEntity[]> {
    console.log('getAll');
    return this.saleslistsService.findAll();
  }

  @Get('/memberid')
  getSaleslistId(
    @Body() dto: CreateSaleslistDTO,
    @Req() req,
  ): Promise<SaleslistEntity[]> {
    const { userId } = req.query;
    console.log('getSaleslistMemberId');
    return this.saleslistsService.findBySaleslistMemberId(userId);
  }
  @Get('/byListNumber')
  getSaleslist(
    @Body() dto: CreateSaleslistDTO,
    @Req() req,
  ): Promise<SaleslistEntity[]> {
    const { listNum } = req.query;
    console.log('getSaleslistMemberId');
    return this.saleslistsService.findBySaleslistMemberId(listNum);
  }

  @Get('/saleslistname')
  getSaleslistName(@Body() dto: CreateSaleslistDTO): Promise<SaleslistEntity> {
    console.log('getSaleslistName');
    return this.saleslistsService.findBySaleslistName(dto.sales_list_name);
  }

  @Get('/salesliscorporations')
  getSaleslistCorporations(
    @Body() dto: CreateSaleslistDTO,
    @Req() req,
  ): Promise<SaleslistEntity> {
    console.log('getSaleslistName');
    const salesList = req.query;
    return this.saleslistsService.findSaleslistCorporations(
      salesList.salesListNumber,
      salesList.salesListType,
    );
  }
  @Get('/saleslistnumber')
  getSaleslistNumber(
    @Body() dto: CreateSaleslistDTO,
  ): Promise<SaleslistEntity> {
    console.log('getSaleslistNumber');
    return this.saleslistsService.findBySaleslistNumber(dto.sales_list_number);
  }

  @Post('/createlist')
  async createSaleslist(@Body() saleslist: CreateSaleslistDTO) {
    console.log('createSaleslist');
    const createdSalesList = await this.saleslistsService.create(saleslist);

    console.log(saleslist);
    if (saleslist.sales_list_type === '01') {
      for (const corporationId of saleslist.datas) {
        this.saleslistsService.createsalescorporations(
          corporationId,
          createdSalesList,
        );
      }
    } else if (saleslist.sales_list_type === '02') {
      for (const data of saleslist.datas) {
        this.saleslistsService.createsalesstaffs(
          data['staff_id'],
          data['corporation_id'],
          createdSalesList,
        );
      }
    }
  }

  @Post('/tranStatusChange')
  tranStatusChange(@Body() salesCorpration: CreateSalesCorporationsListDTO) {
    console.log('tranStatusChange');
    const updateSalesCorp = this.saleslistsService.updateTranStatus(
      salesCorpration.transaction_status,
      salesCorpration.sales_list_number,
      salesCorpration.corporation_id,
    );
    return updateSalesCorp;
  }

  @Post('/memoChange')
  memoChange(@Body() salesCorpration: CreateSalesCorporationsListDTO) {
    console.log('memoChange');
    const updateMemo = this.saleslistsService.updateMemo(
      salesCorpration.memo,
      salesCorpration.sales_list_number,
      salesCorpration.corporation_id,
    );
    return updateMemo;
  }

  @Patch()
  updateSaleslist(@Body() saleslist: UpdateSaleslistDTO) {
    console.log('updateSaleslist');
    return this.saleslistsService.update(saleslist);
  }

  @Delete(':sales_list_number')
  removeOne(@Param() sales_list_number: string): Promise<void> {
    return this.saleslistsService.remove(sales_list_number);
  }
}

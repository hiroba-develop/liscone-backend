import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  Res,
  Query,
} from '@nestjs/common';
import { CreateSalesCorporationsListDTO } from '../dto/create-salescorporationslist.dto';
import { CreateSaleslistDTO } from '../dto/create-saleslist.dto';
import { CreateSalesStaffsListDTO } from '../dto/create-salesstaffslist.dto';
import { SalesCorporationsTaskDTO } from '../dto/salescorporationstask.dto';
import { UpdateSaleslistDTO } from '../dto/update-saleslist.dto';
import { SalesListProceed } from '../entities/salesListProceedView.entity';
import { SalesListStatistics } from '../entities/salesListView.entity';
import { SalesListCorporations } from '../entities/salesListcorporationsview.entity';
import { SalesListcorporationDetail } from '../entities/salesListcorporationDetail.entity';
import { SalesCorporaitonsListEntity } from '../entities/salescorporationslists.entity';
import { SaleslistEntity } from '../entities/saleslists.entity';
import { SaleslistsService } from '../service/saleslists.service';
@Controller('saleslists')
export class SaleslistsController {
  private dataCount: number;
  constructor(private readonly saleslistsService: SaleslistsService) {}

  @Get()
  getAll(): Promise<SaleslistEntity[]> {
    console.log('getAll');
    return this.saleslistsService.findAll();
  }

  @Get('/companyCode')
  getCompanyCode(
    @Body() dto: SaleslistEntity[],
    @Query('companyCode') companyCode: string,
  ): Promise<SaleslistEntity[]> {
    console.log('getCompanyCode');
    return this.saleslistsService.findByCompanyCode(companyCode);
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

  @Get('/statistic')
  getSaleslistStatistic(@Req() req): Promise<SalesListStatistics[]> {
    console.log('getSaleslistStatistic');
    const { userId } = req.query;
    return this.saleslistsService.getSaleslistStatistic(userId);
  }

  @Get('/proceed')
  getSaleslistProceed(@Req() req): Promise<SalesListProceed> {
    console.log('getSaleslistProceed');
    const { member_id, sales_list_number, created_dateFrom, created_dateTo } =
      req.query;
    return this.saleslistsService.getSaleslistProceed(
      member_id,
      sales_list_number,
      created_dateFrom,
      created_dateTo,
    );
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

  @Get('/saleslistcorporations')
  getSaleslistCorporations(
    @Body() dto: SalesCorporationsTaskDTO,
    @Req() req,
  ): Promise<SalesListCorporations[]> {
    console.log('getSaleslistCorporations');
    const salesList = req.query;
    return this.saleslistsService.findSaleslistCorporations(
      salesList.salesListNumber,
    );
  }

  @Get('/saleslistcorporationsDetail')
  getSaleslistCorporationsDetail(
    @Body() dto: SalesCorporationsTaskDTO,
    @Req() req,
  ): Promise<SalesListcorporationDetail[]> {
    console.log('getSaleslistCorporationsDetail');
    const salesList = req.query;
    return this.saleslistsService.findSaleslistCorporationsDetail(
      salesList.salesListNumber,
    );
  }

  @Get('/salescorporationinfo')
  getSalesCorporationInfo(
    @Body() dto: CreateSalesCorporationsListDTO,
    @Req() req,
  ): Promise<SalesCorporaitonsListEntity> {
    console.log('getSalesCorporationInfo');
    const salesCorp = req.query;
    return this.saleslistsService.findSalesCorporationInfo(
      salesCorp.sales_list_number,
      salesCorp.corporation_id,
    );
  }

  @Get('/salesliststaffs')
  getSaleslistStaffs(
    @Body() dto: CreateSalesStaffsListDTO,
    @Req() req,
  ): Promise<SaleslistEntity[]> {
    console.log('getSaleslistCorporations');
    const salesList = req.query;
    return this.saleslistsService.findSaleslistStaff(salesList.salesListNumber);
  }

  @Get('/saleslistnumber')
  getSaleslistNumber(
    @Query('salesListNumber') salesListNumber: number,
  ): Promise<SaleslistEntity> {
    console.log('getSaleslistNumber');
    return this.saleslistsService.findBySaleslistNumber(salesListNumber);
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

  @Post('/corpTranStatusChange')
  corpTranStatusChange(
    @Body() salesCorpration: CreateSalesCorporationsListDTO,
  ) {
    console.log('corpTranStatusChange');
    const updateSalesCorp = this.saleslistsService.updateCorpTranStatus(
      salesCorpration.transaction_status,
      salesCorpration.sales_list_number,
      salesCorpration.corporation_id,
    );
    return updateSalesCorp;
  }

  @Post('/corpMemoChange')
  corpMemoChange(@Body() salesCorpration: CreateSalesCorporationsListDTO) {
    console.log('corpMemoChange');
    const updateMemo = this.saleslistsService.updateCorpMemo(
      salesCorpration.memo,
      salesCorpration.sales_list_number,
      salesCorpration.corporation_id,
    );
    return updateMemo;
  }

  @Post('/staffTranStatusChange')
  staffTranStatusChange(@Body() salesStaff: CreateSalesStaffsListDTO) {
    console.log('staffTranStatusChange');
    const updateSalesCorp = this.saleslistsService.updateStaffTranStatus(
      salesStaff.transaction_status,
      salesStaff.sales_list_number,
      salesStaff.corporation_id,
      salesStaff.staff_id,
    );
    return updateSalesCorp;
  }

  @Post('/staffMemoChange')
  taffMemoChange(@Body() salesStaff: CreateSalesStaffsListDTO) {
    console.log('staffMemoChange');
    const updateMemo = this.saleslistsService.updateStaffMemo(
      salesStaff.memo,
      salesStaff.sales_list_number,
      salesStaff.corporation_id,
      salesStaff.staff_id,
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

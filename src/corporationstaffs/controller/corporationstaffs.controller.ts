import {
  Body,
  Controller,
  Delete,
  Get,
  Patch,
  Post,
  Req,
  Query,
} from '@nestjs/common';
import { CreateCorporationstaffDTO } from '../dto/create-corporationstaff.dto';
import { CorporationstaffEntity } from '../entities/corporationstaffs.entity';
import { CorporationstaffsService } from '../service/corporationstaffs.service';

@Controller('corporationstaffs')
export class CorporationstaffsController {
  constructor(
    private readonly corporationstaffsService: CorporationstaffsService,
  ) {}

  @Get()
  getAll(
    @Body() dto: CreateCorporationstaffDTO,
  ): Promise<CorporationstaffEntity[]> {
    console.log('getAll');
    return this.corporationstaffsService.findAllCorporationstaffs(dto);
  }

  @Get('/searchChick')
  getAllSearch(
    @Body() dto: CreateCorporationstaffDTO[],
    @Query('searchCorporationName') searchCorporationName: string,
    @Query('searchJobPosition1') searchJobPosition1: string,
    @Query('searchJobPosition2') searchJobPosition2: string,
    @Query('searchJobPosition3') searchJobPosition3: string,
    @Query('searchJobPosition4') searchJobPosition4: string,
    @Query('searchJobPosition5') searchJobPosition5: string,
    @Query('searchDepartment1') searchDepartment1: string,
    @Query('searchDepartment2') searchDepartment2: string,
    @Query('searchDepartment3') searchDepartment3: string,
    @Query('searchDepartment4') searchDepartment4: string,
    @Query('searchDepartment5') searchDepartment5: string,
    @Query('searchProfileSourceType') searchProfileSourceType: string,
    @Query('searchStaffName') searchStaffName: string,
  ): Promise<CorporationstaffEntity[]> {
    console.log('getAllSearchChick');

    return this.corporationstaffsService.findAllCorporationstaffsSearchChick(
      searchCorporationName,
      searchJobPosition1,
      searchJobPosition2,
      searchJobPosition3,
      searchJobPosition4,
      searchJobPosition5,
      searchDepartment1,
      searchDepartment2,
      searchDepartment3,
      searchDepartment4,
      searchDepartment5,
      searchProfileSourceType,
      searchStaffName,
    );
  }

  @Get('/searchChickCount')
  getAllSearchCount(
    @Body() dto: CreateCorporationstaffDTO[],
    @Query('searchCorporationName') searchCorporationName: string,
    @Query('searchJobPosition1') searchJobPosition1: string,
    @Query('searchJobPosition2') searchJobPosition2: string,
    @Query('searchJobPosition3') searchJobPosition3: string,
    @Query('searchJobPosition4') searchJobPosition4: string,
    @Query('searchJobPosition5') searchJobPosition5: string,
    @Query('searchDepartment1') searchDepartment1: string,
    @Query('searchDepartment2') searchDepartment2: string,
    @Query('searchDepartment3') searchDepartment3: string,
    @Query('searchDepartment4') searchDepartment4: string,
    @Query('searchDepartment5') searchDepartment5: string,
    @Query('searchProfileSourceType') searchProfileSourceType: string,
    @Query('searchStaffName') searchStaffName: string,
  ): Promise<number> {
    console.log('getAllSearchCount');
    console.log(searchDepartment2);
    return this.corporationstaffsService.findAllCorporationstaffsSearchChickCount(
      searchCorporationName,
      searchJobPosition1,
      searchJobPosition2,
      searchJobPosition3,
      searchJobPosition4,
      searchJobPosition5,
      searchDepartment1,
      searchDepartment2,
      searchDepartment3,
      searchDepartment4,
      searchDepartment5,
      searchProfileSourceType,
      searchStaffName,
    );
  }

  @Get('/id_name_byCorporation')
  getStaffsIdNameByCorporation(
    @Body() dto: CreateCorporationstaffDTO,
    @Req() req,
  ): Promise<CorporationstaffEntity[]> {
    console.log('getStaffsIdNameByCorporation');
    const { corporationId } = req.query;
    console.log('getStaffsIdNameByCorporation');
    return this.corporationstaffsService.findStaffsIdNameByCorporation(
      corporationId,
    );
  }

  @Get('/bySalesList')
  getStaffsBySalesList(
    @Body() dto: CreateCorporationstaffDTO,
    @Req() req,
  ): Promise<CorporationstaffEntity[]> {
    console.log('getStaffsIdNameByCorporation');
    const { salesListNumber } = req.query;
    console.log('getStaffsIdNameByCorporation');
    return this.corporationstaffsService.findStaffsBySalesList(salesListNumber);
  }

  @Get('/byCorporation')
  getStaffsByCorporation(
    @Body() dto: CreateCorporationstaffDTO,
    @Req() req,
  ): Promise<CorporationstaffEntity[]> {
    console.log('getStaffsByCorporation');
    const { corporationId } = req.query;
    return this.corporationstaffsService.findStaffsByCorporation(corporationId);
  }
  @Get('/search')
  getAllCorporationstaff(
    @Body() dto: CreateCorporationstaffDTO,
  ): Promise<CorporationstaffEntity[]> {
    console.log('Corporationstaff search');
    return this.corporationstaffsService.findAllCorporationstaffs(dto);
  }
  @Get('/byId')
  getCorporationstaffById(
    @Body() dto: CreateCorporationstaffDTO,
    @Req() req,
  ): Promise<CorporationstaffEntity[]> {
    console.log('Corporationstaff search byId');
    const { staff_id } = req.query;
    return this.corporationstaffsService.findCorporationstaffsById(staff_id);
  }

  @Post()
  createCorporationstaff(@Body() Corporationstaff: CreateCorporationstaffDTO) {
    console.log('createCorporationstaff');
    return this.corporationstaffsService.create(Corporationstaff);
  }

  @Patch()
  updateSalestask(@Body() Corporationstaff: CreateCorporationstaffDTO) {
    console.log('updateCorporationstaff');
    return this.corporationstaffsService.update(Corporationstaff);
  }

  @Delete()
  removeOne(
    @Body() Corporationstaff: CreateCorporationstaffDTO,
  ): Promise<void> {
    return this.corporationstaffsService.remove(Corporationstaff);
  }
}

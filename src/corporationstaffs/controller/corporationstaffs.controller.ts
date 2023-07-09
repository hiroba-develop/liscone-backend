import {
  Body,
  Controller,
  Delete,
  Get,
  Patch,
  Post,
  Req,
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
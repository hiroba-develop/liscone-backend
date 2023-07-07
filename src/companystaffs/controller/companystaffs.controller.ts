import {
  Body,
  Controller,
  Delete,
  Get,
  Patch,
  Post,
  Req,
} from '@nestjs/common';
import { CreateCompanystaffDTO } from '../dto/create-companystaff.dto';
import { CompanystaffEntity } from '../entities/companystaffs.entity';
import { CompanystaffsService } from '../service/companystaffs.service';

@Controller('companystaffs')
export class CompanystaffsController {
  constructor(private readonly companystaffsService: CompanystaffsService) {}

  @Get()
  getAll(@Body() dto: CreateCompanystaffDTO): Promise<CompanystaffEntity[]> {
    console.log('getAll');
    return this.companystaffsService.findAllCompanystaffs(dto);
  }

  @Get('/id_name_byCompany')
  getStaffsIdNameByCompany(
    @Body() dto: CreateCompanystaffDTO,
    @Req() req,
  ): Promise<CompanystaffEntity[]> {
    console.log('getStaffsIdNameByCompany');
    const { corporationId } = req.query;
    console.log('getStaffsIdNameByCompany');
    return this.companystaffsService.findStaffsIdNameByCompany(corporationId);
  }

  @Get('/byCompany')
  getStaffsByCompany(
    @Body() dto: CreateCompanystaffDTO,
    @Req() req,
  ): Promise<CompanystaffEntity[]> {
    console.log('getStaffsByCompany');
    const { corporationId } = req.query;
    return this.companystaffsService.findStaffsByCompany(corporationId);
  }
  @Get('/search')
  getAllCompanystaff(
    @Body() dto: CreateCompanystaffDTO,
  ): Promise<CompanystaffEntity[]> {
    console.log('companystaff search');
    return this.companystaffsService.findAllCompanystaffs(dto);
  }

  @Post()
  createCompanystaff(@Body() companystaff: CreateCompanystaffDTO) {
    console.log('createCompanystaff');
    return this.companystaffsService.create(companystaff);
  }

  @Patch()
  updateSalestask(@Body() companystaff: CreateCompanystaffDTO) {
    console.log('updateCompanystaff');
    return this.companystaffsService.update(companystaff);
  }

  @Delete()
  removeOne(@Body() companystaff: CreateCompanystaffDTO): Promise<void> {
    return this.companystaffsService.remove(companystaff);
  }
}

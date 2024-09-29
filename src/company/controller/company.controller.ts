import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  Query,
} from '@nestjs/common';
import { CompanyEntity } from '../entities/company.entity';
import { CompanyService } from '../service/company.service';
@Controller('company')
export class CompanyController {
  constructor(private readonly membersService: CompanyService) {}

  @Get('/byCompanycode')
  getCompanyByCompanyCode(@Req() req): Promise<CompanyEntity[]> {
    const { companyCode } = req.query;
    console.log('getCompanyByCompanyCode');
    return this.membersService.findByCompanycode(companyCode);
  }
}

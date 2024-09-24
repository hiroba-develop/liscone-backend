import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CompanyEntity } from './entities/company.entity';
import { CompanyController } from './controller/company.controller';
import { CompanyService } from './service/company.service';

@Module({
  imports: [TypeOrmModule.forFeature([CompanyEntity])],
  controllers: [CompanyController],
  providers: [CompanyService],
})
export class CompanyModule { }
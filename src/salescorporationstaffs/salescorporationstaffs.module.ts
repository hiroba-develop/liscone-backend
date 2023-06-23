import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SalesCorporationstaffEntity } from './entities/salescorporationstaffs.entity';
import { SalesCorporationstaffsController } from './controller/salescorporationstaffs.controller';
import { SalesCorporationstaffsService } from './service/salescorporationstaffs.service';

@Module({
  imports: [TypeOrmModule.forFeature([SalesCorporationstaffEntity])],
  controllers: [SalesCorporationstaffsController],
  providers: [SalesCorporationstaffsService],
})
export class SalesCorporationstaffsModule { }
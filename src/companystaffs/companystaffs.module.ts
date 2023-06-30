import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CompanystaffEntity } from './entities/companystaffs.entity';
import { CompanystaffsController } from './controller/companystaffs.controller';
import { CompanystaffsService } from './service/companystaffs.service';

@Module({
  imports: [TypeOrmModule.forFeature([CompanystaffEntity])],
  controllers: [CompanystaffsController],
  providers: [CompanystaffsService],
})
export class CompanystaffsModule { }
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SalestaskEntity } from './entities/salestasks.entity';
import { SalestasksController } from './controller/salestasks.controller';
import { SalestasksService } from './service/salestasks.service';

@Module({
  imports: [TypeOrmModule.forFeature([SalestaskEntity])],
  controllers: [SalestasksController],
  providers: [SalestasksService],
})
export class SalestasksModule { }
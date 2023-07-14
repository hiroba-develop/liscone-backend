import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SalestaskEntity } from './entities/salestasks.entity';
import { SalestasksController } from './controller/salestasks.controller';
import { SalestasksService } from './service/salestasks.service';
import { BigResult } from './entities/salesTaskBRView.entity';
import { SmallResult } from './entities/salesTaskSRView.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([SalestaskEntity]),
    TypeOrmModule.forFeature([BigResult]),
    TypeOrmModule.forFeature([SmallResult]),
  ],
  controllers: [SalestasksController],
  providers: [SalestasksService],
})
export class SalestasksModule {}

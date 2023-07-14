import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SaleslistEntity } from './entities/saleslists.entity';
import { SaleslistsController } from './controller/saleslists.controller';
import { SaleslistsService } from './service/saleslists.service';
import { SalesCorporaitonsListEntity } from './entities/salescorporationslists.entity';
import { SalesStaffsListEntity } from './entities/salesstaffslists.entity';
import { SalesListCorporations } from './entities/salesListcorporationsview.entity';
import { SalesListStatistics } from './entities/salesListView.entity';
import { SalesListProceed } from './entities/salesListProceedView.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([SaleslistEntity]),
    TypeOrmModule.forFeature([SalesCorporaitonsListEntity]),
    TypeOrmModule.forFeature([SalesStaffsListEntity]),
    TypeOrmModule.forFeature([SalesListCorporations]),
    TypeOrmModule.forFeature([SalesListStatistics]),
    TypeOrmModule.forFeature([SalesListProceed]),
  ],
  controllers: [SaleslistsController],
  providers: [SaleslistsService],
})
export class SaleslistsModule {}

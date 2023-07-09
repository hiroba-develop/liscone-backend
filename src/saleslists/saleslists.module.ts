import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SaleslistEntity } from './entities/saleslists.entity';
import { SaleslistsController } from './controller/saleslists.controller';
import { SaleslistsService } from './service/saleslists.service';
import { SalesCorporaitonsListEntity } from './entities/salescorporationslists.entity';
import { SalesStaffsListEntity } from './entities/salesstaffslists.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([SaleslistEntity]),
    TypeOrmModule.forFeature([SalesCorporaitonsListEntity]),
    TypeOrmModule.forFeature([SalesStaffsListEntity]),
  ],
  controllers: [SaleslistsController],
  providers: [SaleslistsService],
})
export class SaleslistsModule {}

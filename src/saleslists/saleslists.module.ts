import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SaleslistEntity } from './entities/saleslists.entity';
import { SaleslistsController } from './controller/saleslists.controller';
import { SaleslistsService } from './service/saleslists.service';

@Module({
  imports: [TypeOrmModule.forFeature([SaleslistEntity])],
  controllers: [SaleslistsController],
  providers: [SaleslistsService],
})
export class SaleslistsModule { }
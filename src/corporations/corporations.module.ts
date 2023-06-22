import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CorporationEntity } from './entities/corporations.entity';
import { CorporationsController } from './controller/corporations.controller';
import { CorporationsService } from './service/corporations.service';

@Module({
  imports: [TypeOrmModule.forFeature([CorporationEntity])],
  controllers: [CorporationsController],
  providers: [CorporationsService],
})
export class CorporationsModule { }
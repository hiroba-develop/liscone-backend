import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CorporationstaffEntity } from './entities/corporationstaffs.entity';
import { CorporationstaffsController } from './controller/corporationstaffs.controller';
import { CorporationstaffsService } from './service/corporationstaffs.service';

@Module({
  imports: [TypeOrmModule.forFeature([CorporationstaffEntity])],
  controllers: [CorporationstaffsController],
  providers: [CorporationstaffsService],
})
export class CorporationstaffsModule {}

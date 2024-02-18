import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RecruitEntity } from './entities/recruit.entity';
import { RecruitController } from './controller/recruit.controller';
import { RecruitService } from './service/recruit.service';

@Module({
  imports: [TypeOrmModule.forFeature([RecruitEntity])],
  controllers: [RecruitController],
  providers: [RecruitService],
})
export class RecruitModule {}

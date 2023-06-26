import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MemberSalestaskEntity } from './entities/membersalestasks.entity';
import { MemberSalestasksController } from './controller/membersalestasks.controller';
import { MemberSalestasksService } from './service/membersalestasks.service';

@Module({
  imports: [TypeOrmModule.forFeature([MemberSalestaskEntity])],
  controllers: [MemberSalestasksController],
  providers: [MemberSalestasksService],
})
export class MemberSalestasksModule { }
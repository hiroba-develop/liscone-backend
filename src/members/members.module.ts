import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MemberEntity } from './entities/members.entity';
import { MembersController } from './controller/members.controller';
import { MembersService } from './service/members.service';

@Module({
  imports: [TypeOrmModule.forFeature([MemberEntity])],
  controllers: [MembersController],
  providers: [MembersService],
})
export class MembersModule { }
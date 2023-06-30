import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Patch,
} from '@nestjs/common';
import { CreateMemberDTO } from '../dto/create-member.dto';
import { UpdateMemberDTO } from '../dto/update-member.dto';
import { MemberEntity } from '../entities/members.entity';
import { MembersService } from '../service/members.service';
import { ChangePasswordMemberDTO } from '../dto/chpass-member.dto';
@Controller('members')
export class MembersController {
  constructor(private readonly membersService: MembersService) {}

  @Get()
  getAll(): Promise<MemberEntity[]> {
    console.log('getAll');
    return this.membersService.findAll();
  }

  @Get('/id')
  getMemberId(@Body() dto: CreateMemberDTO): Promise<MemberEntity> {
    console.log('getMemberId');
    return this.membersService.findByMemberId(dto.member_id);
  }

  @Get('/name')
  getMemberName(@Body() dto: CreateMemberDTO): Promise<MemberEntity> {
    console.log('getMemberName');
    return this.membersService.findByMemberName(dto.member_name);
  }

  @Post('/login')
  login(@Body() member: CreateMemberDTO): Promise<MemberEntity> {
    console.log('login');
    return this.membersService.login(member.member_id, member.password);
  }

  @Post('/changepassword')
  changepassword(@Body() member: ChangePasswordMemberDTO) {
    console.log('changepassword');
    return this.membersService.updatePassword(member);
  }

  @Post()
  createMember(@Body() member: CreateMemberDTO) {
    console.log('createMember');
    return this.membersService.create(member);
  }

  @Patch()
  updatemember(@Body() member: UpdateMemberDTO) {
    console.log('updateMember');
    return this.membersService.update(member);
  }

  @Delete(':id')
  removeOne(@Param() id: string): Promise<void> {
    return this.membersService.remove(id);
  }
}

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChangePasswordMemberDTO } from '../dto/chpass-member.dto';
import { CreateMemberDTO } from '../dto/create-member.dto';
import { UpdateMemberDTO } from '../dto/update-member.dto';
import { MemberEntity } from '../entities/members.entity';

@Injectable()
export class MembersService {
  constructor(
    @InjectRepository(MemberEntity)
    private membersRepository: Repository<MemberEntity>,
  ) {}

  findAll(): Promise<MemberEntity[]> {
    return this.membersRepository.find();
  }

  findByMemberId(member_id: string): Promise<MemberEntity> {
    return this.membersRepository.findOne({
      where: {
        member_id,
      },
    });
  }
  findByCompanycode(company_code: string): Promise<MemberEntity[]> {
    return this.membersRepository.find({
      where: {
        company_code,
      },
    });
  }

  findByAuth(member_id: string, password: string): Promise<MemberEntity> {
    return this.membersRepository.findOne({
      where: {
        member_id,
        password,
      },
    });
  }

  findPassword(member_id: string): Promise<MemberEntity> {
    return this.membersRepository.findOne({
      select: ['password'],
      where: {
        member_id,
      },
    });
  }

  findByMemberName(member_name: string): Promise<MemberEntity> {
    return this.membersRepository.findOne({
      where: {
        member_name,
      },
    });
  }

  async login(member_id, password: string): Promise<MemberEntity> {
    const resultMember = await this.findByAuth(member_id, password);
    if (null == resultMember) {
      throw new NotFoundException(
        'メールアドレスとパスワードが正しいかご確認ください。',
      );
    }
    return resultMember;
  }

  async create(member: CreateMemberDTO) {
    await this.membersRepository.save(member);
  }

  async update(member: UpdateMemberDTO) {
    const resultMember = await this.findByMemberId(member.member_id);
    if (!resultMember) {
      throw new NotFoundException('member id is not exist');
    }
    try {
      await this.membersRepository.update(member.member_id, {
        company_code: member.company_code,
        member_name: member.member_name,
        password: member.password,
        dormant_status: member.dormant_status,
        password_expired_day: member.password_expired_day,
      });
      return await this.findByMemberId(member.member_id);
    } catch (e) {
      console.log('there is no member having id : ' + member.member_id);
      throw e;
    }
  }
  async updatePassword(member: ChangePasswordMemberDTO) {
    console.log(member.password);
    const pass = (await this.findPassword(member.member_id)).password;
    if (member.password != pass) {
      throw new NotFoundException('既存パスワードをご確認ください。');
    }
    const expiredDay = '2100-12-31';

    try {
      await this.membersRepository.update(member.member_id, {
        password: member.newpassword,
        password_expired_day: expiredDay,
      });
    } catch (e) {
      console.log('there is no member having id : ' + member.member_id);
      throw e;
    }
  }
  async remove(id: string): Promise<void> {
    await this.membersRepository.delete(id);
  }
}

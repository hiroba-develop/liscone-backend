import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateMemberDTO } from '../dto/create-member.dto';
import { MemberEntity } from '../entities/members.entity';
import { UpdateMemberDTO } from '../dto/update-member.dto';

@Injectable()
export class MembersService {
    constructor(
        @InjectRepository(MemberEntity)
        private membersRepository: Repository<MemberEntity>,
    ) { }

    findAll(): Promise<MemberEntity[]> {
        return this.membersRepository.find();
    }

    findByMemberId(member_id: string): Promise<MemberEntity> {
        return this.membersRepository.findOne({
            where: {
                member_id,
            }
        });
    }
    
    findByMemberName(member_name: string): Promise<MemberEntity> {
        return this.membersRepository.findOne({
            where: {
                member_name,
            }
        });
    }
    
    async create(member: CreateMemberDTO) {
        await this.membersRepository.save(member)
    }

    async update(member: UpdateMemberDTO) {
        const resultMember = await this.findByMemberId(member.member_id);
        try{
            await this.membersRepository.update(                
                    member.member_id ,
                {                 
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
    
    async remove(id: string): Promise<void> {
        await this.membersRepository.delete(id);
    }
}
import { Inject, Injectable, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateMembercompanyproductDTO } from '../dto/create-membercompanyproduct.dto';
import { MembercompanyproductEntity } from '../entities/membercompanyproducts.entity';
import { UpdateMembercompanyproductDTO } from '../dto/update-membercompanyproduct.dto';

@Injectable()
export class MembercompanyproductsService {
    constructor(
        @InjectRepository(MembercompanyproductEntity)
        private membercompanyproductsRepository: Repository<MembercompanyproductEntity>,
    ) { }

    findAll(): Promise<MembercompanyproductEntity[]> {
        return this.membercompanyproductsRepository.find();
    }
    
    
    findByMembercompanyproductName(product_name: string): Promise<MembercompanyproductEntity> {
        return this.membercompanyproductsRepository.findOne({
            where: {
                product_name,
            }
        });
    }
    
    findByMembercompanyproductNumber(product_number: string): Promise<MembercompanyproductEntity> {
        return this.membercompanyproductsRepository.findOne({
            where: {
                product_number,
            }
        });
    }

    findByMembercompanyproductCompanycode(company_code: string): Promise<MembercompanyproductEntity> {
        return this.membercompanyproductsRepository.findOne({
            where: {
                company_code,
            }
        });
    }
    
    async create(membercompanyproduct: CreateMembercompanyproductDTO) {
        await this.membercompanyproductsRepository.save(membercompanyproduct)
    }

    async update(membercompanyproduct: UpdateMembercompanyproductDTO) {
        const resultMembercompanyproduct = await this.findByMembercompanyproductNumber(membercompanyproduct.product_number);
        if (!resultMembercompanyproduct) {
            throw new NotFoundException("product_number is not exist");
        }
        try{
            await this.membercompanyproductsRepository.update(
                membercompanyproduct.product_number, 
                {
                    company_code: membercompanyproduct.company_code,
                    product_name: membercompanyproduct.product_name,
                    product_price: membercompanyproduct.product_price,
                    created_by: membercompanyproduct.created_by,
                    modified_by: membercompanyproduct.modified_by
                });
            return await this.findByMembercompanyproductNumber(membercompanyproduct.product_number);
        } catch (e) {
            console.log('there is no product_number : ' + membercompanyproduct.product_number);
            throw e;
        }
    }
    
    async remove(product_number: string): Promise<void> {
        await this.membercompanyproductsRepository.delete(product_number);
    }
}
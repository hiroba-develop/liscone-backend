import { Inject, Injectable, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, Between, IsNull, Not} from 'typeorm';
import { CreateCorporationDTO } from '../dto/create-corporation.dto';
import { CorporationEntity } from '../entities/corporations.entity';
import { UpdateCorporationDTO } from '../dto/update-corporation.dto';

@Injectable()
export class CorporationsService {
    constructor(
        @InjectRepository(CorporationEntity)
        private corporationsRepository: Repository<CorporationEntity>,
    ) { }

    findAll(): Promise<CorporationEntity[]> {
        return this.corporationsRepository.find();
    }

    findByCorporationAll(corporation: CreateCorporationDTO): Promise<CorporationEntity[]> {
        let query = this.corporationsRepository.createQueryBuilder("tb_corporation");
        query.where("1 = 1");
        if(typeof corporation.corporate_number !== 'undefined') {
            query.andWhere("corporate_number = :corporate_number", {corporate_number: corporation.corporate_number});
        }
        if(typeof corporation.corporation_name !== 'undefined') {
            query.andWhere("corporation_name = :corporation_name", {corporation_name: corporation.corporation_name});
        }
        if(typeof corporation.business_category !== 'undefined') {
            query.andWhere("business_category = :business_category", {business_category: corporation.business_category});
        }
        if(typeof corporation.representative_phone_number !== 'undefined') {
            query.andWhere("representative_phone_number = :representative_phone_number", {representative_phone_number: corporation.representative_phone_number});
        }
        if(typeof corporation.listing_status !== 'undefined') {
            query.andWhere("listing_status = :listing_status", {listing_status: corporation.listing_status});
        }
        if(typeof corporation.address !== 'undefined') {
            query = query.andWhere("address LIKE :address", { address: `%${corporation.address}%` });
        }
        if(typeof corporation.sales_from_amount !== 'undefined' && typeof corporation.sales_to_amount !== 'undefined') {
            query = query.andWhere("sales_amount BETWEEN :from1 AND :to1 ", { from1: corporation.sales_from_amount,to1: corporation.sales_to_amount});
        }
        if(typeof corporation.employee_from_number !== 'undefined' && typeof corporation.employee_to_number !== 'undefined') {
            query = query.andWhere("employee_number BETWEEN :from2 AND :to2 ", { from2: corporation.employee_from_number,to2: corporation.employee_to_number});
        }
        if(typeof corporation.establishment_from_year !== 'undefined' && typeof corporation.establishment_to_year !== 'undefined') {
            query = query.andWhere("establishment_year BETWEEN :from3 AND :to3 ", { from3: corporation.establishment_from_year,to3: corporation.establishment_to_year});
        }
        if(typeof corporation.capital_from_stock !== 'undefined' && typeof corporation.capital_to_stock !== 'undefined') {
            query = query.andWhere("capital_stock BETWEEN :from4 AND :to4 ", { from4: corporation.capital_from_stock,to4: corporation.capital_to_stock});
        }
        return query.getMany();
    }
    
    findByCorporationName(corporation_name: string): Promise<CorporationEntity> {
        return this.corporationsRepository.findOne({
            where: {
                corporation_name,
            }
        });
    }
    
    async create(corporation: CreateCorporationDTO) {
        await this.corporationsRepository.save(corporation)
    }

    async update(corporation: CreateCorporationDTO) {
        const resultcorporation = await this.findByCorporationAll(corporation);
        if (!resultcorporation) {
            throw new NotFoundException("corporation id is not exist");
        }
        try{
            await this.corporationsRepository.update(
                corporation.corporation_id, 
                {
                    corporation_name: corporation.corporation_name,
                    corporate_number: corporation.corporate_number,
                    address: corporation.address,
                    business_category: corporation.business_category,
                    capital_stock: corporation.capital_stock,
                    created_by: corporation.created_by,
                    employee_number: corporation.employee_number,
                    establishment_year: corporation.establishment_year,
                    home_page: corporation.home_page,
                    listing_status: corporation.listing_status,
                    modified_by: corporation.modified_by,
                    representative_name: corporation.representative_name,
                    representative_phone_number: corporation.representative_phone_number,
                    sales_amount: corporation.sales_amount,
                    zip_code: corporation.zip_code, 
                });
            return await this.findByCorporationAll(corporation);
        } catch (e) {
            console.log('there is no corporation having id : ' + corporation);
            throw e;
        }
    }
    
    async remove(id: string): Promise<void> {
        await this.corporationsRepository.delete(id);
    }
}
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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

    findByCorporationId(corporation_id: string): Promise<CorporationEntity> {
        return this.corporationsRepository.findOne({
            where: {
                corporation_id,
            }
        });
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

    async update(corporation: UpdateCorporationDTO) {
        const resultcorporation = await this.findByCorporationId(corporation.corporation_id);
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
            return await this.findByCorporationId(corporation.corporation_id);
        } catch (e) {
            console.log('there is no corporation having id : ' + corporation.corporation_id);
            throw e;
        }
    }
    
    async remove(id: string): Promise<void> {
        await this.corporationsRepository.delete(id);
    }
}
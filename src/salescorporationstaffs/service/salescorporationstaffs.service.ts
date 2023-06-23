import { Inject, Injectable, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateSalesCorporationstaffDTO } from '../dto/create-salescorporationstaff.dto';
import { SalesCorporationstaffEntity } from '../entities/salescorporationstaffs.entity';
import { UpdateSalesCorporationstaffDTO } from '../dto/update-salescorporationstaff.dto';

@Injectable()
export class SalesCorporationstaffsService {
    constructor(
        @InjectRepository(SalesCorporationstaffEntity)
        private salescorporationstaffsRepository: Repository<SalesCorporationstaffEntity>,
    ) { }

    findAll(): Promise<SalesCorporationstaffEntity[]> {
        return this.salescorporationstaffsRepository.find();
    }

    findBySalesCorporationstaffId(staff_id: string): Promise<SalesCorporationstaffEntity> {
        return this.salescorporationstaffsRepository.findOne({
            where: {
                staff_id,
            }
        });
    }
    
    async create(salescorporationstaff: CreateSalesCorporationstaffDTO) {
        await this.salescorporationstaffsRepository.save(salescorporationstaff)
    }

    async update(salescorporationstaff: UpdateSalesCorporationstaffDTO) {
        const resultstaff = await this.findBySalesCorporationstaffId(salescorporationstaff.staff_id);
        if (!resultstaff) {
            throw new NotFoundException("staff id is not exist");
        }
        try{
            await this.salescorporationstaffsRepository.update(
                salescorporationstaff.staff_id, 
                {
                    corporation_id: salescorporationstaff.corporation_id,
                    sales_list_number: salescorporationstaff.sales_list_number,
                    memo: salescorporationstaff.memo,
                    created_by: salescorporationstaff.created_by,
                    modified_by: salescorporationstaff.modified_by,
                });
            return await this.findBySalesCorporationstaffId(salescorporationstaff.staff_id);
        } catch (e) {
            console.log('there is no corporation having id : ' + salescorporationstaff.staff_id);
            throw e;
        }
    }
    
    async remove(id: string): Promise<void> {
        await this.salescorporationstaffsRepository.delete(id);
    }
}
import { Body, Controller, Delete, Get, Param, Post, Put, Patch } from '@nestjs/common'
import { CreateSalesCorporationstaffDTO } from '../dto/create-salescorporationstaff.dto';
import { UpdateSalesCorporationstaffDTO } from '../dto/update-salescorporationstaff.dto';
import { SalesCorporationstaffEntity } from '../entities/salescorporationstaffs.entity';
import { SalesCorporationstaffsService } from '../service/salescorporationstaffs.service';
@Controller('salescorporationstaffs')
export class SalesCorporationstaffsController {
    constructor(private readonly salescorporationstaffsService: SalesCorporationstaffsService) { }

    @Get()
    getAll(): Promise<SalesCorporationstaffEntity[]> {
        console.log("getAll");
        return this.salescorporationstaffsService.findAll();
    }

    @Get('/staffid')
    getSalesCorporationstaffId(@Body() dto: CreateSalesCorporationstaffDTO): Promise<SalesCorporationstaffEntity> {
        console.log("getSalesCorporationstaffId");
        return this.salescorporationstaffsService.findBySalesCorporationstaffId(dto.staff_id);
    }

    @Post()
    createSalesCorporationstaff(@Body() salescorporationstaff: CreateSalesCorporationstaffDTO) {
        console.log("createSalesCorporationstaff");
        return this.salescorporationstaffsService.create(salescorporationstaff);
    }

    @Patch()
    updateSalesCorporationstaff(@Body() salescorporationstaff: UpdateSalesCorporationstaffDTO) {
        console.log("updateSalesCorporationstaff");
        return this.salescorporationstaffsService.update(salescorporationstaff);
    }

    @Delete(':id')
    removeOne(@Param() id: string): Promise<void> {
        return this.salescorporationstaffsService.remove(id);
    }

}
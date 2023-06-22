import { Body, Controller, Delete, Get, Param, Post, Put, Patch } from '@nestjs/common'
import { CreateSaleslistDTO } from '../dto/create-saleslist.dto';
import { UpdateSaleslistDTO } from '../dto/update-saleslist.dto';
import { SaleslistEntity } from '../entities/saleslists.entity';
import { SaleslistsService } from '../service/saleslists.service';
@Controller('saleslists')
export class SaleslistsController {
    constructor(private readonly saleslistsService: SaleslistsService) { }

    @Get()
    getAll(): Promise<SaleslistEntity[]> {
        console.log("getAll");
        return this.saleslistsService.findAll();
    }

    @Get('/memberid')
    getSaleslistId(@Body() dto: CreateSaleslistDTO): Promise<SaleslistEntity> {
        console.log("getSaleslistMemberId");
        return this.saleslistsService.findBySaleslistMemberId(dto.member_id);
    }

    @Get('/saleslistname')
    getSaleslistName(@Body() dto: CreateSaleslistDTO): Promise<SaleslistEntity> {
        console.log("getSaleslistName");
        return this.saleslistsService.findBySaleslistName(dto.sales_list_name);
    }
    
    @Get('/saleslistnumber')
    getSaleslistNumber(@Body() dto: CreateSaleslistDTO): Promise<SaleslistEntity> {
        console.log("getSaleslistNumber");
        return this.saleslistsService.findBySaleslistNumber(dto.sales_list_number);
    }

    @Post()
    createSaleslist(@Body() saleslist: CreateSaleslistDTO) {
        console.log("createSaleslist");
        return this.saleslistsService.create(saleslist);
    }

    @Patch()
    updateSaleslist(@Body() saleslist: UpdateSaleslistDTO) {
        console.log("updateSaleslist");
        return this.saleslistsService.update(saleslist);
    }

    @Delete(':sales_list_number')
    removeOne(@Param() sales_list_number: string): Promise<void> {
        return this.saleslistsService.remove(sales_list_number);
    }

}
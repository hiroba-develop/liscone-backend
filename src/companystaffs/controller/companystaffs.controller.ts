import { Body, Controller, Delete, Get, Param, Post, Put, Patch } from '@nestjs/common'
import { CreateCompanystaffDTO } from '../dto/create-companystaff.dto';
import { UpdateCompanystaffDTO } from '../dto/update-companystaff.dto';
import { CompanystaffEntity } from '../entities/companystaffs.entity';
import { CompanystaffsService } from '../service/companystaffs.service';

@Controller('companystaffs')
export class CompanystaffsController {
    constructor(private readonly companystaffsService: CompanystaffsService) { }

    @Get()
    getAll(): Promise<CompanystaffEntity[]> {
        console.log("getAll");
        return this.companystaffsService.findAll();
    }

    @Get('/search')
    getAllCompanystaff(@Body() dto: CreateCompanystaffDTO): Promise<CompanystaffEntity[]> {
        console.log("companystaff search");
        return this.companystaffsService.findAllCompanystaffs(dto);
    }

    
    @Post()
    createCompanystaff(@Body() companystaff: CreateCompanystaffDTO) {
        console.log("createCompanystaff");
        return this.companystaffsService.create(companystaff);
    }

    @Patch()
    updateSalestask(@Body() companystaff: CreateCompanystaffDTO) {
        console.log("updateCompanystaff");
        return this.companystaffsService.update(companystaff);
    }

    @Delete()
    removeOne(@Body() companystaff: CreateCompanystaffDTO): Promise<void> {
        return this.companystaffsService.remove(companystaff);
    }

}
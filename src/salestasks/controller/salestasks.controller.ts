import { Body, Controller, Delete, Get, Param, Post, Put, Patch } from '@nestjs/common'
import { CreateSalestaskDTO } from '../dto/create-salestask.dto';
import { UpdateSalestaskDTO } from '../dto/update-salestask.dto';
import { SalestaskEntity } from '../entities/salestasks.entity';
import { SalestasksService } from '../service/salestasks.service';
@Controller('salestasks')
export class SalestasksController {
    constructor(private readonly salestasksService: SalestasksService) { }

    @Get()
    getAll(): Promise<SalestaskEntity[]> {
        console.log("getAll");
        return this.salestasksService.findAll();
    }

    @Get('/memberid')
    getSalestaskId(@Body() dto: CreateSalestaskDTO): Promise<SalestaskEntity> {
        console.log("getSalestaskMemberId");
        return this.salestasksService.findBySalestaskMemberId(dto.member_id);
    }

    @Get('/taskname')
    getSalestaskName(@Body() dto: CreateSalestaskDTO): Promise<SalestaskEntity> {
        console.log("getSalestaskName");
        return this.salestasksService.findBySalestaskTaskName(dto.task_name);
    }
    
    @Get('/tasknumber')
    getSalestaskNumber(@Body() dto: CreateSalestaskDTO): Promise<SalestaskEntity> {
        console.log("getSalestaskTaskNumber");
        return this.salestasksService.findBySalestaskTaskNumber(dto.task_number);
    }

    
    @Post()
    createSalestask(@Body() salestask: CreateSalestaskDTO) {
        console.log("createSalestask");
        return this.salestasksService.create(salestask);
    }

    @Patch()
    updateSalestask(@Body() salestask: UpdateSalestaskDTO) {
        console.log("updateSalestask");
        return this.salestasksService.update(salestask);
    }

    @Delete(':id')
    removeOne(@Param() id: string): Promise<void> {
        return this.salestasksService.remove(id);
    }

}
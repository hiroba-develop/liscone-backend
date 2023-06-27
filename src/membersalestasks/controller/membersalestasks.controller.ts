import { Body, Controller, Delete, Get, Param, Post, Put, Patch } from '@nestjs/common'
import { CreateMemberSalestaskDTO } from '../dto/create-membersalestask.dto';
import { UpdateMemberSalestaskDTO } from '../dto/update-membersalestask.dto';
import { MemberSalestaskEntity } from '../entities/membersalestasks.entity';
import { MemberSalestasksService } from '../service/membersalestasks.service';

@Controller('membersalestasks')
export class MemberSalestasksController {
    constructor(private readonly memberSalestasksService: MemberSalestasksService) { }

    @Get()
    getAll(): Promise<MemberSalestaskEntity[]> {
        console.log("getAll");
        return this.memberSalestasksService.findAll();
    }

    @Get('/search')
    getAllMemberSalestask(@Body() dto: CreateMemberSalestaskDTO): Promise<MemberSalestaskEntity[]> {
        console.log("membersalestask search");
        return this.memberSalestasksService.findAllMemberSalesTask(dto);
    }

    
    @Post()
    createMemberSalestask(@Body() membersalestask: CreateMemberSalestaskDTO) {
        console.log("createMembersalestask");
        return this.memberSalestasksService.create(membersalestask);
    }

    @Patch()
    updateSalestask(@Body() membersalestask: CreateMemberSalestaskDTO) {
        console.log("updateMembersalestask");
        return this.memberSalestasksService.update(membersalestask);
    }

    @Delete()
    removeOne(@Body() membersalestask: UpdateMemberSalestaskDTO): Promise<void> {
        return this.memberSalestasksService.remove(membersalestask);
    }

}
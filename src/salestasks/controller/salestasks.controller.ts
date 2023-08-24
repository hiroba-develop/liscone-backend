import { Body, Controller, Get, Post, Req, Query } from '@nestjs/common';
import { CreateSalestaskDTO } from '../dto/create-salestask.dto';
import { SalesTaskDTO } from '../dto/salestask.dto';
import { SalestaskEntity } from '../entities/salestasks.entity';
import { SalestasksService } from '../service/salestasks.service';
@Controller('salestasks')
export class SalestasksController {
  constructor(private readonly salestasksService: SalestasksService) {}

  @Get()
  getAll(): Promise<SalestaskEntity[]> {
    console.log('getAll');
    return this.salestasksService.findAll();
  }

  @Get('/companyCode')
  getCompanyCode(
    @Body() dto: CreateSalestaskDTO[],
    @Query('companyCode') companyCode: string,
  ): Promise<SalestaskEntity[]> {
    console.log('getCompanyCode');
    return this.salestasksService.findByCompanyCode(companyCode);
  }

  @Get('/memberid')
  getSalestaskId(@Body() dto: CreateSalestaskDTO): Promise<SalestaskEntity> {
    console.log('getSalestaskMemberId');
    return this.salestasksService.findBySalestaskMemberId(dto.member_id);
  }

  @Get('/taskname')
  getSalestaskName(@Body() dto: CreateSalestaskDTO): Promise<SalestaskEntity> {
    console.log('getSalestaskName');
    return this.salestasksService.findBySalestaskTaskName(dto.task_name);
  }

  @Get('/taskBR')
  getSalestaskBR(@Req() req): Promise<SalestaskEntity> {
    console.log('getSalestaskBR');
    const { member_id, sales_list_number, execute_dateFrom, execute_dateTo } =
      req.query;
    return this.salestasksService.findBySalestaskTaskBR(
      member_id,
      sales_list_number,
      execute_dateFrom,
      execute_dateTo,
    );
  }

  @Get('/taskSR')
  getSalestaskSR(@Req() req): Promise<SalestaskEntity> {
    console.log('getSalestaskSR');
    const { member_id, sales_list_number, execute_dateFrom, execute_dateTo } =
      req.query;
    return this.salestasksService.findBySalestaskTaskSR(
      member_id,
      sales_list_number,
      execute_dateFrom,
      execute_dateTo,
    );
  }

  @Get('/tasknumber')
  getSalestaskNumber(
    @Body() dto: CreateSalestaskDTO,
  ): Promise<SalestaskEntity> {
    console.log('getSalestaskTaskNumber');
    return this.salestasksService.findBySalestaskTaskNumber(dto.task_number);
  }

  @Post('/createTask')
  createSalestask(@Body() salestask: SalesTaskDTO) {
    console.log('createSalestask');
    return this.salestasksService.create(salestask);
  }

  @Post('/updateTask')
  updateTask(@Body() salestask: SalesTaskDTO) {
    console.log('updateTask');
    return this.salestasksService.update(salestask);
  }

  @Post('/updateSalesTask')
  updateSalestask(@Body() salestask: SalesTaskDTO) {
    console.log('updateSalesTask');
    return this.salestasksService.updateSalesTask(salestask);
  }

  @Post('/deleteTask')
  removeOne(@Body() task_number: string): Promise<void> {
    return this.salestasksService.remove(task_number);
  }
}

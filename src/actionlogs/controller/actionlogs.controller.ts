import {
  Body,
  Controller,
  Delete,
  Get,
  Patch,
  Post,
  Req,
} from '@nestjs/common';
import { CreateActionlogDTO } from '../dto/create-actionlog.dto';
import { ActionlogEntity } from '../entities/actionlogs.entity';
import { ActionlogsService } from '../service/actionlogs.service';

@Controller('actionlogs')
export class ActionlogsController {
  constructor(private readonly actionlogsService: ActionlogsService) {}

  @Get()
  getAll(): Promise<ActionlogEntity[]> {
    console.log('getAll');
    return this.actionlogsService.findAll();
  }

  @Get('/search')
  getAllActionlog(@Body() dto: CreateActionlogDTO): Promise<ActionlogEntity[]> {
    console.log('actionlog search');
    return this.actionlogsService.findAllActionlogs(dto);
  }

  @Get('/salesListActions')
  getSalesListActionlog(
    @Body() dto: CreateActionlogDTO,
    @Req() req,
  ): Promise<ActionlogEntity[]> {
    const { salesList, listDetails } = req.query;
    console.log('actionlog search');
    return this.actionlogsService.findSalesListActionlogs({
      salesList,
      listDetails,
    });
  }

  @Post()
  createActionlog(@Body() actionlog: CreateActionlogDTO) {
    console.log('createActionlog');
    return this.actionlogsService.create(actionlog);
  }

  @Patch()
  updateSalestask(@Body() actionlog: CreateActionlogDTO) {
    console.log('updateActionlog');
    return this.actionlogsService.update(actionlog);
  }

  @Delete()
  removeOne(@Body() actionlog: CreateActionlogDTO): Promise<void> {
    return this.actionlogsService.remove(actionlog);
  }
}

import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Req,
  Query,
  Put,
  Patch,
} from '@nestjs/common';
import { CreateRecruitDTO } from '../dto/create-recruit.dto';
import { UpdateRecruitDTO } from '../dto/update-recruit.dto';
import { RecruitEntity } from '../entities/recruit.entity';
import { RecruitService } from '../service/recruit.service';
@Controller('recruit')
export class RecruitController {
  constructor(private readonly salescorporationstaffsService: RecruitService) {}

  @Get()
  getAll(): Promise<RecruitEntity[]> {
    console.log('getAll');
    return this.salescorporationstaffsService.findAll();
  }

  @Get('/searchRecruitResult')
  getRecruitResult(
    @Body() dto: CreateRecruitDTO,
    @Query('searchRecruitBigResult') searchRecruitBigResult: string,
    @Query('searchRecruitMiddleResult') searchRecruitMiddleResult: string,
    @Query('searchRecruitSmallResult') searchRecruitSmallResult: string,
  ): Promise<RecruitEntity[]> {
    console.log('getRecruitResult');
    return this.salescorporationstaffsService.findByRecruitResult(
      dto,
      searchRecruitBigResult,
      searchRecruitMiddleResult,
      searchRecruitSmallResult,
    );
  }

  @Get('/corporationId')
  getcorporationId(
    @Body() dto: CreateRecruitDTO,
    @Query('corporationId') corporationId: string,
  ): Promise<RecruitEntity[]> {
    console.log('getcorporationId');
    return this.salescorporationstaffsService.findByCorporationNumber(
      dto,
      corporationId,
    );
  }

  @Post()
  createSalesCorporationstaff(@Body() salescorporationstaff: CreateRecruitDTO) {
    console.log('createSalesCorporationstaff');
    return this.salescorporationstaffsService.create(salescorporationstaff);
  }

  @Patch()
  updateSalesCorporationstaff(@Body() salescorporationstaff: UpdateRecruitDTO) {
    console.log('updateSalesCorporationstaff');
    return this.salescorporationstaffsService.update(salescorporationstaff);
  }

  @Delete(':id')
  removeOne(@Param() id: string): Promise<void> {
    return this.salescorporationstaffsService.remove(id);
  }
}

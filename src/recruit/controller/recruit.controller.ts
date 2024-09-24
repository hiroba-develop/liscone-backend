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
  constructor(private readonly recruitService: RecruitService) {}

  @Get()
  getAll(): Promise<RecruitEntity[]> {
    console.log('getAll');
    return this.recruitService.findAll();
  }

  @Get('/searchRecruitResultCount')
  getRecruitResultCount(
    @Body() dto: CreateRecruitDTO,
    @Query('searchRecruitBigResult') searchRecruitBigResult: string,
    @Query('searchRecruitMiddleResult') searchRecruitMiddleResult: string,
    @Query('searchRecruitSmallResult') searchRecruitSmallResult: string,
  ): Promise<RecruitEntity[]> {
    console.log('getRecruitResultCount');
    return this.recruitService.findByRecruitResultCount(
      dto,
      searchRecruitBigResult,
      searchRecruitMiddleResult,
      searchRecruitSmallResult,
    );
  }

  @Get('/searchRecruitResult')
  getRecruitResult(
    @Body() dto: CreateRecruitDTO,
    @Query('searchRecruitBigResult') searchRecruitBigResult: string,
    @Query('searchRecruitMiddleResult') searchRecruitMiddleResult: string,
    @Query('searchRecruitSmallResult') searchRecruitSmallResult: string,
  ): Promise<RecruitEntity[]> {
    console.log('getRecruitResult');
    return this.recruitService.findByRecruitResult(
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
    return this.recruitService.findByCorporationNumber(
      dto,
      corporationId,
    );
  }

  @Post()
  createSalesCorporationstaff(@Body() salescorporationstaff: CreateRecruitDTO) {
    console.log('createSalesCorporationstaff');
    return this.recruitService.create(salescorporationstaff);
  }

  @Patch()
  updateSalesCorporationstaff(@Body() salescorporationstaff: UpdateRecruitDTO) {
    console.log('updateSalesCorporationstaff');
    return this.recruitService.update(salescorporationstaff);
  }

  @Delete(':id')
  removeOne(@Param() id: string): Promise<void> {
    return this.recruitService.remove(id);
  }
}

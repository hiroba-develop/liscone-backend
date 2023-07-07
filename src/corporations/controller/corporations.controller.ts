import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
} from '@nestjs/common';
import { CreateCorporationDTO } from '../dto/create-corporation.dto';
import { CorporationEntity } from '../entities/corporations.entity';
import { CorporationsService } from '../service/corporations.service';
@Controller('corporations')
export class CorporationsController {
  constructor(private readonly corporationsService: CorporationsService) {}

  @Get()
  getAll(): Promise<CorporationEntity[]> {
    console.log('getAll');
    return this.corporationsService.findAll();
  }

  @Get('/search')
  getCorporation(
    @Body() dto: CreateCorporationDTO,
    @Req() req,
  ): Promise<CorporationEntity[]> {
    console.log('getCorporationSearch');
    const { corporationId } = req.query;
    return this.corporationsService.findByCorporationAll(dto);
  }

  @Get('/byId')
  getCorporationById(
    @Body() dto: CreateCorporationDTO,
    @Req() req,
  ): Promise<CorporationEntity[]> {
    console.log('getCorporationSearch');
    const { corporationId } = req.query;
    return this.corporationsService.findByCorporationId(corporationId);
  }

  @Get('/name')
  getCorporationName(
    @Body() dto: CreateCorporationDTO,
  ): Promise<CorporationEntity> {
    console.log('getCorporationName');
    return this.corporationsService.findByCorporationName(dto.corporation_name);
  }

  @Post()
  createCorporation(@Body() corporation: CreateCorporationDTO) {
    console.log('createCorporation');
    return this.corporationsService.create(corporation);
  }

  @Patch()
  updateCorporation(@Body() corporation: CreateCorporationDTO) {
    console.log('updateCorporation');
    return this.corporationsService.update(corporation);
  }

  @Delete(':id')
  removeOne(@Param() id: string): Promise<void> {
    return this.corporationsService.remove(id);
  }
}

import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  Query,
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
    @Query('searchCorporateNumber') searchCorporateNumber: string,
    @Query('searchCorporationName') searchCorporationName: string,
    @Query('searchIndustry') searchIndustry: string,
    @Query('searchPrefectures') searchPrefectures: string,
    @Query('searchRepresentativePhoneNumber')
    searchRepresentativePhoneNumber: string,
    @Query('searchCorporationListStatus') searchCorporationListStatus: string,
    @Query('searchMinSalesAmount') searchMinSalesAmount: string,
    @Query('searchMaxSalesAmount') searchMaxSalesAmount: string,
    @Query('searchMinEmployeeNumber') searchMinEmployeeNumber: string,
    @Query('searchMaxEmployeeNumber') searchMaxEmployeeNumber: string,
    @Query('searchMinEstablishmentYear') searchMinEstablishmentYear: string,
    @Query('searchMaxEstablishmentYear') searchMaxEstablishmentYear: string,
    @Query('searchMinCapitalStock') searchMinCapitalStock: string,
    @Query('searchMaxCapitalStock') searchMaxCapitalStock: string,
  ): Promise<CorporationEntity[]> {
    console.log('getCorporationSearch');
    return this.corporationsService.findByCorporationAll(
      dto,
      searchCorporateNumber,
      searchCorporationName,
      searchIndustry,
      searchPrefectures,
      searchRepresentativePhoneNumber,
      searchCorporationListStatus,
      searchMinSalesAmount,
      searchMaxSalesAmount,
      searchMinEmployeeNumber,
      searchMaxEmployeeNumber,
      searchMinEstablishmentYear,
      searchMaxEstablishmentYear,
      searchMinCapitalStock,
      searchMaxCapitalStock,
    );
  }

  @Get('/searchCount')
  getCorporationCount(
    @Body() dto: CreateCorporationDTO,
    @Query('searchCorporateNumber') searchCorporateNumber: string,
    @Query('searchCorporationName') searchCorporationName: string,
    @Query('searchIndustry') searchIndustry: string,
    @Query('searchPrefectures') searchPrefectures: string,
    @Query('searchRepresentativePhoneNumber')
    searchRepresentativePhoneNumber: string,
    @Query('searchCorporationListStatus') searchCorporationListStatus: string,
    @Query('searchMinSalesAmount') searchMinSalesAmount: string,
    @Query('searchMaxSalesAmount') searchMaxSalesAmount: string,
    @Query('searchMinEmployeeNumber') searchMinEmployeeNumber: string,
    @Query('searchMaxEmployeeNumber') searchMaxEmployeeNumber: string,
    @Query('searchMinEstablishmentYear') searchMinEstablishmentYear: string,
    @Query('searchMaxEstablishmentYear') searchMaxEstablishmentYear: string,
    @Query('searchMinCapitalStock') searchMinCapitalStock: string,
    @Query('searchMaxCapitalStock') searchMaxCapitalStock: string,
  ): Promise<number> {
    console.log('getCorporationSearchCount');
    return this.corporationsService.findByCorporationAllCount(
      dto,
      searchCorporateNumber,
      searchCorporationName,
      searchIndustry,
      searchPrefectures,
      searchRepresentativePhoneNumber,
      searchCorporationListStatus,
      searchMinSalesAmount,
      searchMaxSalesAmount,
      searchMinEmployeeNumber,
      searchMaxEmployeeNumber,
      searchMinEstablishmentYear,
      searchMaxEstablishmentYear,
      searchMinCapitalStock,
      searchMaxCapitalStock,
    );
  }

  @Get('/searchImport')
  getSearchImport(
    @Body() dto: CreateCorporationDTO,
    @Query('corporateNumber') corporateNumber: string,
    @Query('homePage') homePage: string,
    @Query('corporationName') corporationName: string,
    @Query('zipCode') zipCode: string,
  ): Promise<CorporationEntity[]> {
    console.log('getCorporationSearch');
    return this.corporationsService.findByCorporationImport(
      dto,
      corporateNumber,
      homePage,
      corporationName,
      zipCode,
    );
  }

  @Get('/byId')
  getCorporationById(
    @Body() dto: CreateCorporationDTO,
    @Req() req,
  ): Promise<CorporationEntity[]> {
    console.log('getCorporationByIdSearch');
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
  updateCorporation(
    @Body() corporation: CreateCorporationDTO,
    @Query('searchCorporateNumber') searchCorporateNumber: string,
    @Query('searchCorporationName') searchCorporationName: string,
    @Query('searchIndustry') searchIndustry: string,
    @Query('searchPrefectures') searchPrefectures: string,
    @Query('searchRepresentativePhoneNumber')
    searchRepresentativePhoneNumber: string,
    @Query('searchCorporationListStatus') searchCorporationListStatus: string,
    @Query('searchMinSalesAmount') searchMinSalesAmount: string,
    @Query('searchMaxSalesAmount') searchMaxSalesAmount: string,
    @Query('searchMinEmployeeNumber') searchMinEmployeeNumber: string,
    @Query('searchMaxEmployeeNumber') searchMaxEmployeeNumber: string,
    @Query('searchMinEstablishmentYear') searchMinEstablishmentYear: string,
    @Query('searchMaxEstablishmentYear') searchMaxEstablishmentYear: string,
    @Query('searchMinCapitalStock') searchMinCapitalStock: string,
    @Query('searchMaxCapitalStock') searchMaxCapitalStock: string,
  ) {
    console.log('updateCorporation');
    return this.corporationsService.update(
      corporation,
      searchCorporateNumber,
      searchCorporationName,
      searchIndustry,
      searchPrefectures,
      searchRepresentativePhoneNumber,
      searchCorporationListStatus,
      searchMinSalesAmount,
      searchMaxSalesAmount,
      searchMinEmployeeNumber,
      searchMaxEmployeeNumber,
      searchMinEstablishmentYear,
      searchMaxEstablishmentYear,
      searchMinCapitalStock,
      searchMaxCapitalStock,
    );
  }

  @Delete(':id')
  removeOne(@Param() id: string): Promise<void> {
    return this.corporationsService.remove(id);
  }
}

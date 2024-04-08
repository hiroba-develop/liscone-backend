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
    @Query('searchMinSitePV') searchMinSitePV: string,
    @Query('searchMaxSitePV') searchMaxSitePV: string,
    @Query('searchMinAverageAge') searchMinAverageAge: string,
    @Query('searchMaxAverageAge') searchMaxAverageAge: string,
    @Query('searchSNS') searchSNS: string,
    @Query('searchAdvertising') searchAdvertising: string,
    @Query('searchFreeText1') searchFreeText1: string,
    @Query('searchFreeText2') searchFreeText2: string,
    @Query('searchFreeText3') searchFreeText3: string,
    @Query('searchFreeText4') searchFreeText4: string,
    @Query('searchFreeText5') searchFreeText5: string,
    @Query('searchExclusionFreeText1') searchExclusionFreeText1: string,
    @Query('searchExclusionFreeText2') searchExclusionFreeText2: string,
    @Query('searchExclusionFreeText3') searchExclusionFreeText3: string,
    @Query('searchExclusionFreeText4') searchExclusionFreeText4: string,
    @Query('searchExclusionFreeText5') searchExclusionFreeText5: string,
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
      searchMinSitePV,
      searchMaxSitePV,
      searchMinAverageAge,
      searchMaxAverageAge,
      searchSNS,
      searchAdvertising,
      searchFreeText1,
      searchFreeText2,
      searchFreeText3,
      searchFreeText4,
      searchFreeText5,
      searchExclusionFreeText1,
      searchExclusionFreeText2,
      searchExclusionFreeText3,
      searchExclusionFreeText4,
      searchExclusionFreeText5,
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
    @Query('searchMinSitePV') searchMinSitePV: string,
    @Query('searchMaxSitePV') searchMaxSitePV: string,
    @Query('searchMinAverageAge') searchMinAverageAge: string,
    @Query('searchMaxAverageAge') searchMaxAverageAge: string,
    @Query('searchSNS') searchSNS: string,
    @Query('searchAdvertising') searchAdvertising: string,
    @Query('searchFreeText1') searchFreeText1: string,
    @Query('searchFreeText2') searchFreeText2: string,
    @Query('searchFreeText3') searchFreeText3: string,
    @Query('searchFreeText4') searchFreeText4: string,
    @Query('searchFreeText5') searchFreeText5: string,
    @Query('searchExclusionFreeText1') searchExclusionFreeText1: string,
    @Query('searchExclusionFreeText2') searchExclusionFreeText2: string,
    @Query('searchExclusionFreeText3') searchExclusionFreeText3: string,
    @Query('searchExclusionFreeText4') searchExclusionFreeText4: string,
    @Query('searchExclusionFreeText5') searchExclusionFreeText5: string,
  ): Promise<number> {
    console.log('getCorporationSearchCount');
    console.log(searchMinSitePV);
    console.log(searchMaxSitePV);
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
      searchMinSitePV,
      searchMaxSitePV,
      searchMinAverageAge,
      searchMaxAverageAge,
      searchSNS,
      searchAdvertising,
      searchFreeText1,
      searchFreeText2,
      searchFreeText3,
      searchFreeText4,
      searchFreeText5,
      searchExclusionFreeText1,
      searchExclusionFreeText2,
      searchExclusionFreeText3,
      searchExclusionFreeText4,
      searchExclusionFreeText5,
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
    @Query('searchMinSitePV') searchMinSitePV: string,
    @Query('searchMaxSitePV') searchMaxSitePV: string,
    @Query('searchMinAverageAge') searchMinAverageAge: string,
    @Query('searchMaxAverageAge') searchMaxAverageAge: string,
    @Query('searchSNS') searchSNS: string,
    @Query('searchAdvertising') searchAdvertising: string,
    @Query('searchFreeText1') searchFreeText1: string,
    @Query('searchFreeText2') searchFreeText2: string,
    @Query('searchFreeText3') searchFreeText3: string,
    @Query('searchFreeText4') searchFreeText4: string,
    @Query('searchFreeText5') searchFreeText5: string,
    @Query('searchExclusionFreeText1') searchExclusionFreeText1: string,
    @Query('searchExclusionFreeText2') searchExclusionFreeText2: string,
    @Query('searchExclusionFreeText3') searchExclusionFreeText3: string,
    @Query('searchExclusionFreeText4') searchExclusionFreeText4: string,
    @Query('searchExclusionFreeText5') searchExclusionFreeText5: string,
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
      searchMinSitePV,
      searchMaxSitePV,
      searchMinAverageAge,
      searchMaxAverageAge,
      searchSNS,
      searchAdvertising,
      searchFreeText1,
      searchFreeText2,
      searchFreeText3,
      searchFreeText4,
      searchFreeText5,
      searchExclusionFreeText1,
      searchExclusionFreeText2,
      searchExclusionFreeText3,
      searchExclusionFreeText4,
      searchExclusionFreeText5,
    );
  }

  @Delete(':id')
  removeOne(@Param() id: string): Promise<void> {
    return this.corporationsService.remove(id);
  }
}

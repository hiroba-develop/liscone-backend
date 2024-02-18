import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateCorporationDTO } from '../dto/create-corporation.dto';
import { CorporationEntity } from '../entities/corporations.entity';

@Injectable()
export class CorporationsService {
  constructor(
    @InjectRepository(CorporationEntity)
    private corporationsRepository: Repository<CorporationEntity>,
  ) {}

  findAll(): Promise<CorporationEntity[]> {
    return this.corporationsRepository.find();
  }

  findByCorporationId(corporationId: string): Promise<CorporationEntity[]> {
    return this.corporationsRepository.find({
      where: {
        corporation_id: corporationId,
      },
    });
  }

  findByCorporationAll(
    corporation: CreateCorporationDTO,
    searchCorporateNumber: string,
    searchCorporationName: string,
    searchIndustry: string,
    searchPrefectures: string,
    searchRepresentativePhoneNumber: string,
    searchCorporationListStatus: string,
    searchMinSalesAmount: string,
    searchMaxSalesAmount: string,
    searchMinEmployeeNumber: string,
    searchMaxEmployeeNumber: string,
    searchMinEstablishmentYear: string,
    searchMaxEstablishmentYear: string,
    searchMinCapitalStock: string,
    searchMaxCapitalStock: string,
    searchMinSitePV: string,
    searchMaxSitePV: string,
    searchMinAverageAge: string,
    searchMaxAverageAge: string,
    searchSNS: string,
    searchAdvertising: string,
    searchFreeText1: string,
    searchFreeText2: string,
    searchFreeText3: string,
    searchFreeText4: string,
    searchFreeText5: string,
    searchExclusionFreeText1: string,
    searchExclusionFreeText2: string,
    searchExclusionFreeText3: string,
    searchExclusionFreeText4: string,
    searchExclusionFreeText5: string,
  ): Promise<CorporationEntity[]> {
    let query =
      this.corporationsRepository.createQueryBuilder('tb_corporation');
    // 法人番号
    if (searchCorporateNumber !== '') {
      query.andWhere('corporate_number = :searchCorporateNumber', {
        corporate_number: corporation.corporate_number,
        searchCorporateNumber: searchCorporateNumber,
      });
    }
    // 会社名・法人名
    if (searchCorporationName !== '') {
      query.andWhere('corporation_name LIKE :searchCorporationName', {
        corporation_name: corporation.corporation_name,
        searchCorporationName: `%${searchCorporationName}%`,
      });
    }
    // 業種
    if (searchIndustry !== '') {
      query.andWhere('business_category LIKE :searchIndustry', {
        business_category: corporation.business_category,
        searchIndustry: `%${searchIndustry}%`,
      });
    }
    // 都道府県
    if (searchPrefectures !== '') {
      query.andWhere('address LIKE :searchPrefectures', {
        address: corporation.address,
        searchPrefectures: `%${searchPrefectures}%`,
      });
    }
    // 電話番号
    if (searchRepresentativePhoneNumber !== '') {
      query.andWhere(
        'representative_phone_number = :searchRepresentativePhoneNumber',
        {
          representative_phone_number: corporation.representative_phone_number,
          searchRepresentativePhoneNumber: searchRepresentativePhoneNumber,
        },
      );
    }
    // 上場
    if (searchCorporationListStatus !== '') {
      query.andWhere('listing_status LIKE :searchCorporationListStatus', {
        listing_status: corporation.listing_status,
        searchCorporationListStatus: `%${searchCorporationListStatus}%`,
      });
    }
    // 売上
    if (searchMinSalesAmount === '' && searchMaxSalesAmount !== '') {
      query = query.andWhere(
        'sales_amount BETWEEN :searchMinSalesAmount AND :searchMaxSalesAmount ',
        {
          searchMinSalesAmount: 0,
          searchMaxSalesAmount: searchMaxSalesAmount,
        },
      );
    }
    if (searchMinSalesAmount !== '' && searchMaxSalesAmount === '') {
      query = query.andWhere(
        'sales_amount BETWEEN :searchMinSalesAmount AND :searchMaxSalesAmount ',
        {
          searchMinSalesAmount: searchMinSalesAmount,
          searchMaxSalesAmount: 100000000000000,
        },
      );
    }
    if (searchMinSalesAmount !== '' && searchMaxSalesAmount !== '') {
      query = query.andWhere(
        'sales_amount BETWEEN :searchMinSalesAmount AND :searchMaxSalesAmount ',
        {
          searchMinSalesAmount: searchMinSalesAmount,
          searchMaxSalesAmount: searchMaxSalesAmount,
        },
      );
    }
    // 従業員数
    if (searchMinEmployeeNumber === '' && searchMaxEmployeeNumber !== '') {
      query = query.andWhere(
        'employee_number BETWEEN :searchMinEmployeeNumber AND :searchMaxEmployeeNumber ',
        {
          searchMinEmployeeNumber: 0,
          searchMaxEmployeeNumber: searchMaxEmployeeNumber,
        },
      );
    }
    if (searchMinEmployeeNumber !== '' && searchMaxEmployeeNumber === '') {
      query = query.andWhere(
        'employee_number BETWEEN :searchMinEmployeeNumber AND :searchMaxEmployeeNumber ',
        {
          searchMinEmployeeNumber: searchMinEmployeeNumber,
          searchMaxEmployeeNumber: 10000000,
        },
      );
    }
    if (searchMinEmployeeNumber !== '' && searchMaxEmployeeNumber !== '') {
      query = query.andWhere(
        'employee_number BETWEEN :searchMinEmployeeNumber AND :searchMaxEmployeeNumber ',
        {
          searchMinEmployeeNumber: searchMinEmployeeNumber,
          searchMaxEmployeeNumber: searchMaxEmployeeNumber,
        },
      );
    }
    // 設立
    if (
      searchMinEstablishmentYear === '' &&
      searchMaxEstablishmentYear !== ''
    ) {
      query = query.andWhere(
        'establishment_year BETWEEN :searchMinEstablishmentYear AND :searchMaxEstablishmentYear ',
        {
          searchMinEstablishmentYear: 0,
          searchMaxEstablishmentYear: searchMaxEstablishmentYear,
        },
      );
    }
    if (
      searchMinEstablishmentYear !== '' &&
      searchMaxEstablishmentYear === ''
    ) {
      query = query.andWhere(
        'establishment_year BETWEEN :searchMinEstablishmentYear AND :searchMaxEstablishmentYear ',
        {
          searchMinEstablishmentYear: searchMinEstablishmentYear,
          searchMaxEstablishmentYear: 3000,
        },
      );
    }
    if (
      searchMinEstablishmentYear !== '' &&
      searchMaxEstablishmentYear !== ''
    ) {
      query = query.andWhere(
        'establishment_year BETWEEN :searchMinEstablishmentYear AND :searchMaxEstablishmentYear ',
        {
          searchMinEstablishmentYear: searchMinEstablishmentYear,
          searchMaxEstablishmentYear: searchMaxEstablishmentYear,
        },
      );
    }
    // 資本金
    if (searchMinCapitalStock === '' && searchMaxCapitalStock !== '') {
      query = query.andWhere(
        'capital_stock BETWEEN :searchMinCapitalStock AND :searchMaxCapitalStock ',
        {
          searchMinCapitalStock: 0,
          searchMaxCapitalStock: searchMaxCapitalStock,
        },
      );
    }
    if (searchMinCapitalStock !== '' && searchMaxCapitalStock === '') {
      query = query.andWhere(
        'capital_stock BETWEEN :searchMinCapitalStock AND :searchMaxCapitalStock ',
        {
          searchMinCapitalStock: searchMinCapitalStock,
          searchMaxCapitalStock: 100000000000000,
        },
      );
    }
    if (searchMinCapitalStock !== '' && searchMaxCapitalStock !== '') {
      query = query.andWhere(
        'capital_stock BETWEEN :searchMinCapitalStock AND :searchMaxCapitalStock ',
        {
          searchMinCapitalStock: searchMinCapitalStock,
          searchMaxCapitalStock: searchMaxCapitalStock,
        },
      );
    }
    // サイトPV
    if (searchMinSitePV === undefined && searchMaxSitePV !== undefined) {
      query = query.andWhere(
        'site_pv BETWEEN :searchMinSitePV AND :searchMaxSitePV ',
        {
          searchMinSitePV: 0,
          searchMaxSitePV: searchMaxSitePV,
        },
      );
    }
    if (searchMinSitePV !== undefined && searchMaxSitePV === undefined) {
      query = query.andWhere(
        'site_pv BETWEEN :searchMinSitePV AND :searchMaxSitePV ',
        {
          searchMinSitePV: searchMinSitePV,
          searchMaxSitePV: 100000000000000,
        },
      );
    }
    if (searchMinSitePV !== undefined && searchMaxSitePV !== undefined) {
      query = query.andWhere(
        'site_pv BETWEEN :searchMinSitePV AND :searchMaxSitePV ',
        {
          searchMinSitePV: searchMinSitePV,
          searchMaxSitePV: searchMaxSitePV,
        },
      );
    }
    // 平均年齢
    if (searchMinAverageAge === '' && searchMaxAverageAge !== '') {
      query = query.andWhere(
        'site_pv BETWEEN :searchMinAverageAge AND :searchMaxAverageAge ',
        {
          searchMinAverageAge: 0,
          searchMaxAverageAge: searchMaxAverageAge,
        },
      );
    }
    if (searchMinAverageAge !== '' && searchMaxAverageAge === '') {
      query = query.andWhere(
        'site_pv BETWEEN :searchMinAverageAge AND :searchMaxAverageAge ',
        {
          searchMinAverageAge: searchMinAverageAge,
          searchMaxAverageAge: 1000,
        },
      );
    }
    if (searchMinAverageAge !== '' && searchMaxAverageAge !== '') {
      query = query.andWhere(
        'site_pv BETWEEN :searchMinAverageAge AND :searchMaxAverageAge ',
        {
          searchMinAverageAge: searchMinAverageAge,
          searchMaxAverageAge: searchMaxAverageAge,
        },
      );
    }
    // 広告出稿
    if (searchAdvertising !== '') {
      query.andWhere('publishers IS NOT NULL OR ad_networks IS NOT NULL');
    }
    // フリーテキスト
    if (
      searchFreeText5 !== undefined &&
      searchFreeText5 !== '' &&
      searchFreeText5 !== null
    ) {
      query.andWhere(
        '(source_code LIKE :searchFreeText1 AND source_code LIKE :searchFreeText2 AND source_code LIKE :searchFreeText3 AND source_code LIKE :searchFreeText4 AND source_code LIKE :searchFreeText5)',
        {
          searchFreeText1: `%${searchFreeText1}%`,
          searchFreeText2: `%${searchFreeText2}%`,
          searchFreeText3: `%${searchFreeText3}%`,
          searchFreeText4: `%${searchFreeText4}%`,
          searchFreeText5: `%${searchFreeText5}%`,
        },
      );
    } else if (
      searchFreeText4 !== undefined &&
      searchFreeText4 !== '' &&
      searchFreeText4 !== null
    ) {
      query.andWhere(
        '(source_code LIKE :searchFreeText1 AND source_code LIKE :searchFreeText2 AND source_code LIKE :searchFreeText3 AND source_code LIKE :searchFreeText4 )',
        {
          searchFreeText1: `%${searchFreeText1}%`,
          searchFreeText2: `%${searchFreeText2}%`,
          searchFreeText3: `%${searchFreeText3}%`,
          searchFreeText4: `%${searchFreeText4}%`,
        },
      );
    } else if (
      searchFreeText3 !== undefined &&
      searchFreeText3 !== '' &&
      searchFreeText3 !== null
    ) {
      query.andWhere(
        '(source_code LIKE :searchFreeText1 AND source_code LIKE :searchFreeText2 AND source_code LIKE :searchFreeText3)',
        {
          searchFreeText1: `%${searchFreeText1}%`,
          searchFreeText2: `%${searchFreeText2}%`,
          searchFreeText3: `%${searchFreeText3}%`,
        },
      );
    } else if (
      searchFreeText2 !== undefined &&
      searchFreeText2 !== '' &&
      searchFreeText2 !== null
    ) {
      query.andWhere(
        '(source_code LIKE :searchFreeText1 AND source_code LIKE :searchFreeText2 )',
        {
          searchFreeText1: `%${searchFreeText1}%`,
          searchFreeText2: `%${searchFreeText2}%`,
        },
      );
    } else if (
      searchFreeText1 !== undefined &&
      searchFreeText1 !== '' &&
      searchFreeText1 !== null
    ) {
      query.andWhere('source_code LIKE :searchFreeText1', {
        searchFreeText1: `%${searchFreeText1}%`,
      });
    }
    // 除外フリーテキスト
    if (
      searchExclusionFreeText5 !== undefined &&
      searchExclusionFreeText5 !== '' &&
      searchExclusionFreeText5 !== null
    ) {
      query.andWhere(
        '(source_code NOT LIKE :searchExclusionFreeText1 AND source_code NOT LIKE :searchExclusionFreeText2 AND source_code NOT LIKE :searchExclusionFreeText3 AND source_code NOT LIKE :searchExclusionFreeText4 AND source_code NOT LIKE :searchExclusionFreeText5)',
        {
          searchExclusionFreeText1: `%${searchExclusionFreeText1}%`,
          searchExclusionFreeText2: `%${searchExclusionFreeText2}%`,
          searchExclusionFreeText3: `%${searchExclusionFreeText3}%`,
          searchExclusionFreeText4: `%${searchExclusionFreeText4}%`,
          searchExclusionFreeText5: `%${searchExclusionFreeText5}%`,
        },
      );
    } else if (
      searchExclusionFreeText4 !== undefined &&
      searchExclusionFreeText4 !== '' &&
      searchExclusionFreeText4 !== null
    ) {
      query.andWhere(
        '(source_code NOT LIKE :searchExclusionFreeText1 AND source_code NOT LIKE :searchExclusionFreeText2 AND source_code NOT LIKE :searchExclusionFreeText3 AND source_code NOT LIKE :searchExclusionFreeText4 )',
        {
          searchExclusionFreeText1: `%${searchExclusionFreeText1}%`,
          searchExclusionFreeText2: `%${searchExclusionFreeText2}%`,
          searchExclusionFreeText3: `%${searchExclusionFreeText3}%`,
          searchExclusionFreeText4: `%${searchExclusionFreeText4}%`,
        },
      );
    } else if (
      searchExclusionFreeText3 !== undefined &&
      searchExclusionFreeText3 !== '' &&
      searchExclusionFreeText3 !== null
    ) {
      query.andWhere(
        '(source_code NOT LIKE :searchExclusionFreeText1 AND source_code NOT LIKE :searchExclusionFreeText2 AND source_code NOT LIKE :searchExclusionFreeText3)',
        {
          searchExclusionFreeText1: `%${searchExclusionFreeText1}%`,
          searchExclusionFreeText2: `%${searchExclusionFreeText2}%`,
          searchExclusionFreeText3: `%${searchExclusionFreeText3}%`,
        },
      );
    } else if (
      searchExclusionFreeText2 !== undefined &&
      searchExclusionFreeText2 !== '' &&
      searchExclusionFreeText2 !== null
    ) {
      query.andWhere(
        '(source_code NOT LIKE :searchExclusionFreeText1 AND source_code NOT LIKE :searchExclusionFreeText2 )',
        {
          searchExclusionFreeText1: `%${searchExclusionFreeText1}%`,
          searchExclusionFreeText2: `%${searchExclusionFreeText2}%`,
        },
      );
    } else if (
      searchExclusionFreeText1 !== undefined &&
      searchExclusionFreeText1 !== '' &&
      searchExclusionFreeText1 !== null
    ) {
      query.andWhere('source_code NOT LIKE :searchExclusionFreeText1', {
        searchExclusionFreeText1: `%${searchExclusionFreeText1}%`,
      });
    }
    const response = query.getMany();
    console.log(response);
    return response;
  }

  findByCorporationAllCount(
    corporation: CreateCorporationDTO,
    searchCorporateNumber: string,
    searchCorporationName: string,
    searchIndustry: string,
    searchPrefectures: string,
    searchRepresentativePhoneNumber: string,
    searchCorporationListStatus: string,
    searchMinSalesAmount: string,
    searchMaxSalesAmount: string,
    searchMinEmployeeNumber: string,
    searchMaxEmployeeNumber: string,
    searchMinEstablishmentYear: string,
    searchMaxEstablishmentYear: string,
    searchMinCapitalStock: string,
    searchMaxCapitalStock: string,
    searchMinSitePV: string,
    searchMaxSitePV: string,
    searchMinAverageAge: string,
    searchMaxAverageAge: string,
    searchSNS: string,
    searchAdvertising: string,
    searchFreeText1: string,
    searchFreeText2: string,
    searchFreeText3: string,
    searchFreeText4: string,
    searchFreeText5: string,
    searchExclusionFreeText1: string,
    searchExclusionFreeText2: string,
    searchExclusionFreeText3: string,
    searchExclusionFreeText4: string,
    searchExclusionFreeText5: string,
  ): Promise<number> {
    let query =
      this.corporationsRepository.createQueryBuilder('tb_corporation');
    // 法人番号
    if (searchCorporateNumber !== '') {
      query.andWhere('corporate_number = :searchCorporateNumber', {
        corporate_number: corporation.corporate_number,
        searchCorporateNumber: searchCorporateNumber,
      });
    }
    // 会社名・法人名
    if (searchCorporationName !== '') {
      query.andWhere('corporation_name LIKE :searchCorporationName', {
        corporation_name: corporation.corporation_name,
        searchCorporationName: `%${searchCorporationName}%`,
      });
    }
    // 業種
    if (searchIndustry !== '') {
      query.andWhere('business_category LIKE :searchIndustry', {
        business_category: corporation.business_category,
        searchIndustry: `%${searchIndustry}%`,
      });
    }
    // 都道府県
    if (searchPrefectures !== '') {
      query.andWhere('address LIKE :searchPrefectures', {
        address: corporation.address,
        searchPrefectures: `%${searchPrefectures}%`,
      });
    }
    // 電話番号
    if (searchRepresentativePhoneNumber !== '') {
      query.andWhere(
        'representative_phone_number = :searchRepresentativePhoneNumber',
        {
          representative_phone_number: corporation.representative_phone_number,
          searchRepresentativePhoneNumber: searchRepresentativePhoneNumber,
        },
      );
    }
    // 上場
    if (searchCorporationListStatus !== '') {
      query.andWhere('listing_status LIKE :searchCorporationListStatus', {
        listing_status: corporation.listing_status,
        searchCorporationListStatus: `%${searchCorporationListStatus}%`,
      });
    }
    // 売上
    if (searchMinSalesAmount === '' && searchMaxSalesAmount !== '') {
      query = query.andWhere(
        'sales_amount BETWEEN :searchMinSalesAmount AND :searchMaxSalesAmount ',
        {
          searchMinSalesAmount: 0,
          searchMaxSalesAmount: searchMaxSalesAmount,
        },
      );
    }
    if (searchMinSalesAmount !== '' && searchMaxSalesAmount === '') {
      query = query.andWhere(
        'sales_amount BETWEEN :searchMinSalesAmount AND :searchMaxSalesAmount ',
        {
          searchMinSalesAmount: searchMinSalesAmount,
          searchMaxSalesAmount: 100000000000000,
        },
      );
    }
    if (searchMinSalesAmount !== '' && searchMaxSalesAmount !== '') {
      query = query.andWhere(
        'sales_amount BETWEEN :searchMinSalesAmount AND :searchMaxSalesAmount ',
        {
          searchMinSalesAmount: searchMinSalesAmount,
          searchMaxSalesAmount: searchMaxSalesAmount,
        },
      );
    }
    // 従業員数
    if (searchMinEmployeeNumber === '' && searchMaxEmployeeNumber !== '') {
      query = query.andWhere(
        'employee_number BETWEEN :searchMinEmployeeNumber AND :searchMaxEmployeeNumber ',
        {
          searchMinEmployeeNumber: 0,
          searchMaxEmployeeNumber: searchMaxEmployeeNumber,
        },
      );
    }
    if (searchMinEmployeeNumber !== '' && searchMaxEmployeeNumber === '') {
      query = query.andWhere(
        'employee_number BETWEEN :searchMinEmployeeNumber AND :searchMaxEmployeeNumber ',
        {
          searchMinEmployeeNumber: searchMinEmployeeNumber,
          searchMaxEmployeeNumber: 10000000,
        },
      );
    }
    if (searchMinEmployeeNumber !== '' && searchMaxEmployeeNumber !== '') {
      query = query.andWhere(
        'employee_number BETWEEN :searchMinEmployeeNumber AND :searchMaxEmployeeNumber ',
        {
          searchMinEmployeeNumber: searchMinEmployeeNumber,
          searchMaxEmployeeNumber: searchMaxEmployeeNumber,
        },
      );
    }
    // 設立
    if (
      searchMinEstablishmentYear === '' &&
      searchMaxEstablishmentYear !== ''
    ) {
      query = query.andWhere(
        'establishment_year BETWEEN :searchMinEstablishmentYear AND :searchMaxEstablishmentYear ',
        {
          searchMinEstablishmentYear: 0,
          searchMaxEstablishmentYear: searchMaxEstablishmentYear,
        },
      );
    }
    if (
      searchMinEstablishmentYear !== '' &&
      searchMaxEstablishmentYear === ''
    ) {
      query = query.andWhere(
        'establishment_year BETWEEN :searchMinEstablishmentYear AND :searchMaxEstablishmentYear ',
        {
          searchMinEstablishmentYear: searchMinEstablishmentYear,
          searchMaxEstablishmentYear: 3000,
        },
      );
    }
    if (
      searchMinEstablishmentYear !== '' &&
      searchMaxEstablishmentYear !== ''
    ) {
      query = query.andWhere(
        'establishment_year BETWEEN :searchMinEstablishmentYear AND :searchMaxEstablishmentYear ',
        {
          searchMinEstablishmentYear: searchMinEstablishmentYear,
          searchMaxEstablishmentYear: searchMaxEstablishmentYear,
        },
      );
    }
    // 資本金
    if (searchMinCapitalStock === '' && searchMaxCapitalStock !== '') {
      query = query.andWhere(
        'capital_stock BETWEEN :searchMinCapitalStock AND :searchMaxCapitalStock ',
        {
          searchMinCapitalStock: 0,
          searchMaxCapitalStock: searchMaxCapitalStock,
        },
      );
    }
    if (searchMinCapitalStock !== '' && searchMaxCapitalStock === '') {
      query = query.andWhere(
        'capital_stock BETWEEN :searchMinCapitalStock AND :searchMaxCapitalStock ',
        {
          searchMinCapitalStock: searchMinCapitalStock,
          searchMaxCapitalStock: 100000000000000,
        },
      );
    }
    if (searchMinCapitalStock !== '' && searchMaxCapitalStock !== '') {
      query = query.andWhere(
        'capital_stock BETWEEN :searchMinCapitalStock AND :searchMaxCapitalStock ',
        {
          searchMinCapitalStock: searchMinCapitalStock,
          searchMaxCapitalStock: searchMaxCapitalStock,
        },
      );
    }
    // サイトPV
    if (searchMinSitePV === undefined && searchMaxSitePV !== undefined) {
      query = query.andWhere(
        'site_pv BETWEEN :searchMinSitePV AND :searchMaxSitePV ',
        {
          searchMinSitePV: 0,
          searchMaxSitePV: searchMaxSitePV,
        },
      );
    }
    if (searchMinSitePV !== undefined && searchMaxSitePV === undefined) {
      query = query.andWhere(
        'site_pv BETWEEN :searchMinSitePV AND :searchMaxSitePV ',
        {
          searchMinSitePV: searchMinSitePV,
          searchMaxSitePV: 100000000000000,
        },
      );
    }
    if (searchMinSitePV !== undefined && searchMaxSitePV !== undefined) {
      query = query.andWhere(
        'site_pv BETWEEN :searchMinSitePV AND :searchMaxSitePV ',
        {
          searchMinSitePV: searchMinSitePV,
          searchMaxSitePV: searchMaxSitePV,
        },
      );
    }
    // 平均年齢
    if (searchMinAverageAge === '' && searchMaxAverageAge !== '') {
      query = query.andWhere(
        'site_pv BETWEEN :searchMinAverageAge AND :searchMaxAverageAge ',
        {
          searchMinAverageAge: 0,
          searchMaxAverageAge: searchMaxAverageAge,
        },
      );
    }
    if (searchMinAverageAge !== '' && searchMaxAverageAge === '') {
      query = query.andWhere(
        'site_pv BETWEEN :searchMinAverageAge AND :searchMaxAverageAge ',
        {
          searchMinAverageAge: searchMinAverageAge,
          searchMaxAverageAge: 1000,
        },
      );
    }
    if (searchMinAverageAge !== '' && searchMaxAverageAge !== '') {
      query = query.andWhere(
        'site_pv BETWEEN :searchMinAverageAge AND :searchMaxAverageAge ',
        {
          searchMinAverageAge: searchMinAverageAge,
          searchMaxAverageAge: searchMaxAverageAge,
        },
      );
    }
    // 広告出稿
    if (searchAdvertising !== '') {
      query.andWhere('publishers IS NOT NULL OR ad_networks IS NOT NULL');
    }
    // フリーテキスト
    if (
      searchFreeText5 !== undefined &&
      searchFreeText5 !== '' &&
      searchFreeText5 !== null
    ) {
      query.andWhere(
        '(source_code LIKE :searchFreeText1 AND source_code LIKE :searchFreeText2 AND source_code LIKE :searchFreeText3 AND source_code LIKE :searchFreeText4 AND source_code LIKE :searchFreeText5)',
        {
          searchFreeText1: `%${searchFreeText1}%`,
          searchFreeText2: `%${searchFreeText2}%`,
          searchFreeText3: `%${searchFreeText3}%`,
          searchFreeText4: `%${searchFreeText4}%`,
          searchFreeText5: `%${searchFreeText5}%`,
        },
      );
    } else if (
      searchFreeText4 !== undefined &&
      searchFreeText4 !== '' &&
      searchFreeText4 !== null
    ) {
      query.andWhere(
        '(source_code LIKE :searchFreeText1 AND source_code LIKE :searchFreeText2 AND source_code LIKE :searchFreeText3 AND source_code LIKE :searchFreeText4 )',
        {
          searchFreeText1: `%${searchFreeText1}%`,
          searchFreeText2: `%${searchFreeText2}%`,
          searchFreeText3: `%${searchFreeText3}%`,
          searchFreeText4: `%${searchFreeText4}%`,
        },
      );
    } else if (
      searchFreeText3 !== undefined &&
      searchFreeText3 !== '' &&
      searchFreeText3 !== null
    ) {
      query.andWhere(
        '(source_code LIKE :searchFreeText1 AND source_code LIKE :searchFreeText2 AND source_code LIKE :searchFreeText3)',
        {
          searchFreeText1: `%${searchFreeText1}%`,
          searchFreeText2: `%${searchFreeText2}%`,
          searchFreeText3: `%${searchFreeText3}%`,
        },
      );
    } else if (
      searchFreeText2 !== undefined &&
      searchFreeText2 !== '' &&
      searchFreeText2 !== null
    ) {
      query.andWhere(
        '(source_code LIKE :searchFreeText1 AND source_code LIKE :searchFreeText2 )',
        {
          searchFreeText1: `%${searchFreeText1}%`,
          searchFreeText2: `%${searchFreeText2}%`,
        },
      );
    } else if (
      searchFreeText1 !== undefined &&
      searchFreeText1 !== '' &&
      searchFreeText1 !== null
    ) {
      query.andWhere('source_code LIKE :searchFreeText1', {
        searchFreeText1: `%${searchFreeText1}%`,
      });
    }
    // 除外フリーテキスト
    if (
      searchExclusionFreeText5 !== undefined &&
      searchExclusionFreeText5 !== '' &&
      searchExclusionFreeText5 !== null
    ) {
      query.andWhere(
        '(source_code NOT LIKE :searchExclusionFreeText1 AND source_code NOT LIKE :searchExclusionFreeText2 AND source_code NOT LIKE :searchExclusionFreeText3 AND source_code NOT LIKE :searchExclusionFreeText4 AND source_code NOT LIKE :searchExclusionFreeText5)',
        {
          searchExclusionFreeText1: `%${searchExclusionFreeText1}%`,
          searchExclusionFreeText2: `%${searchExclusionFreeText2}%`,
          searchExclusionFreeText3: `%${searchExclusionFreeText3}%`,
          searchExclusionFreeText4: `%${searchExclusionFreeText4}%`,
          searchExclusionFreeText5: `%${searchExclusionFreeText5}%`,
        },
      );
    } else if (
      searchExclusionFreeText4 !== undefined &&
      searchExclusionFreeText4 !== '' &&
      searchExclusionFreeText4 !== null
    ) {
      query.andWhere(
        '(source_code NOT LIKE :searchExclusionFreeText1 AND source_code NOT LIKE :searchExclusionFreeText2 AND source_code NOT LIKE :searchExclusionFreeText3 AND source_code NOT LIKE :searchExclusionFreeText4 )',
        {
          searchExclusionFreeText1: `%${searchExclusionFreeText1}%`,
          searchExclusionFreeText2: `%${searchExclusionFreeText2}%`,
          searchExclusionFreeText3: `%${searchExclusionFreeText3}%`,
          searchExclusionFreeText4: `%${searchExclusionFreeText4}%`,
        },
      );
    } else if (
      searchExclusionFreeText3 !== undefined &&
      searchExclusionFreeText3 !== '' &&
      searchExclusionFreeText3 !== null
    ) {
      query.andWhere(
        '(source_code NOT LIKE :searchExclusionFreeText1 AND source_code NOT LIKE :searchExclusionFreeText2 AND source_code NOT LIKE :searchExclusionFreeText3)',
        {
          searchExclusionFreeText1: `%${searchExclusionFreeText1}%`,
          searchExclusionFreeText2: `%${searchExclusionFreeText2}%`,
          searchExclusionFreeText3: `%${searchExclusionFreeText3}%`,
        },
      );
    } else if (
      searchExclusionFreeText2 !== undefined &&
      searchExclusionFreeText2 !== '' &&
      searchExclusionFreeText2 !== null
    ) {
      query.andWhere(
        '(source_code NOT LIKE :searchExclusionFreeText1 AND source_code NOT LIKE :searchExclusionFreeText2 )',
        {
          searchExclusionFreeText1: `%${searchExclusionFreeText1}%`,
          searchExclusionFreeText2: `%${searchExclusionFreeText2}%`,
        },
      );
    } else if (
      searchExclusionFreeText1 !== undefined &&
      searchExclusionFreeText1 !== '' &&
      searchExclusionFreeText1 !== null
    ) {
      query.andWhere('source_code NOT LIKE :searchExclusionFreeText1', {
        searchExclusionFreeText1: `%${searchExclusionFreeText1}%`,
      });
    }
    const response = query.getCount();
    console.log(response);
    return response;
  }

  findByRecruitCorporationIds(
    corporation: CreateCorporationDTO,
    CorporationIds: [],
  ): Promise<CorporationEntity[]> {
    let query =
      this.corporationsRepository.createQueryBuilder('tb_corporation');
    // 法人番号
    if (CorporationIds.length) {
      query.andWhere('tb_corporation.corporation_id IN (:...ids)', {
        ids: CorporationIds,
      });
    }
    const response = query.getMany();
    console.log(response);
    return response;
  }

  findByCorporationName(corporation_name: string): Promise<CorporationEntity> {
    return this.corporationsRepository.findOne({
      where: {
        corporation_name,
      },
    });
  }

  async create(corporation: CreateCorporationDTO) {
    await this.corporationsRepository.save(corporation);
  }

  async update(
    corporation: CreateCorporationDTO,
    searchCorporateNumber: string,
    searchCorporationName: string,
    searchIndustry: string,
    searchPrefectures: string,
    searchRepresentativePhoneNumber: string,
    searchCorporationListStatus: string,
    searchMinSalesAmount: string,
    searchMaxSalesAmount: string,
    searchMinEmployeeNumber: string,
    searchMaxEmployeeNumber: string,
    searchMinEstablishmentYear: string,
    searchMaxEstablishmentYear: string,
    searchMinCapitalStock: string,
    searchMaxCapitalStock: string,
    searchMinSitePV: string,
    searchMaxSitePV: string,
    searchMinAverageAge: string,
    searchMaxAverageAge: string,
    searchSNS: string,
    searchAdvertising: string,
    searchFreeText1: string,
    searchFreeText2: string,
    searchFreeText3: string,
    searchFreeText4: string,
    searchFreeText5: string,
    searchExclusionFreeText1: string,
    searchExclusionFreeText2: string,
    searchExclusionFreeText3: string,
    searchExclusionFreeText4: string,
    searchExclusionFreeText5: string,
  ) {
    const resultcorporation = await this.findByCorporationAll(
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
    if (!resultcorporation) {
      throw new NotFoundException('corporation id is not exist');
    }
    try {
      await this.corporationsRepository.update(corporation.corporation_id, {
        corporation_name: corporation.corporation_name,
        corporate_number: corporation.corporate_number,
        address: corporation.address,
        business_category: corporation.business_category,
        capital_stock: corporation.capital_stock,
        created_by: corporation.created_by,
        employee_number: corporation.employee_number,
        establishment_year: corporation.establishment_year,
        home_page: corporation.home_page,
        listing_status: corporation.listing_status,
        modified_by: corporation.modified_by,
        representative_name: corporation.representative_name,
        representative_phone_number: corporation.representative_phone_number,
        sales_amount: corporation.sales_amount,
        zip_code: corporation.zip_code,
      });
      return await this.findByCorporationAll(
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
    } catch (e) {
      console.log('there is no corporation having id : ' + corporation);
      throw e;
    }
  }

  async remove(id: string): Promise<void> {
    await this.corporationsRepository.delete(id);
  }
}

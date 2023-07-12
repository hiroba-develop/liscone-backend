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
import { CreateMembercompanyproductDTO } from '../dto/create-membercompanyproduct.dto';
import { UpdateMembercompanyproductDTO } from '../dto/update-membercompanyproduct.dto';
import { MembercompanyproductEntity } from '../entities/membercompanyproducts.entity';
import { MembercompanyproductsService } from '../service/membercompanyproducts.service';

@Controller('membercompanyproducts')
export class MembercompanyproductsController {
  constructor(
    private readonly membercompanyproductsService: MembercompanyproductsService,
  ) {}

  @Get()
  getAll(): Promise<MembercompanyproductEntity[]> {
    console.log('getAll');
    return this.membercompanyproductsService.findAll();
  }

  @Get('/byCompId')
  getCompanyProducts(@Req() req): Promise<MembercompanyproductEntity[]> {
    const { companyCode } = req.query;
    console.log('getAll');
    return this.membercompanyproductsService.findByMembercompanyproductCompanycode(
      companyCode,
    );
  }

  @Get('/productnumber')
  getMembercompanyproductNumber(
    @Body() dto: CreateMembercompanyproductDTO,
  ): Promise<MembercompanyproductEntity> {
    console.log('getMembercompanyproductMemberId');
    return this.membercompanyproductsService.findByMembercompanyproductNumber(
      dto.product_number,
    );
  }

  @Get('/productname')
  getMembercompanyproductName(
    @Body() dto: CreateMembercompanyproductDTO,
  ): Promise<MembercompanyproductEntity> {
    console.log('getMembercompanyproductName');
    return this.membercompanyproductsService.findByMembercompanyproductName(
      dto.product_name,
    );
  }

  @Post()
  createMembercompanyproduct(
    @Body() membercompanyproduct: CreateMembercompanyproductDTO,
  ) {
    console.log('createMembercompanyproduct');
    return this.membercompanyproductsService.create(membercompanyproduct);
  }

  @Patch()
  updateMembercompanyproduct(
    @Body() membercompanyproduct: UpdateMembercompanyproductDTO,
  ) {
    console.log('updateMembercompanyproduct');
    return this.membercompanyproductsService.update(membercompanyproduct);
  }

  @Delete(':product_number')
  removeOne(@Param() product_number: string): Promise<void> {
    return this.membercompanyproductsService.remove(product_number);
  }
}

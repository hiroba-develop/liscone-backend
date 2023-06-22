import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MembercompanyproductEntity } from './entities/membercompanyproducts.entity';
import { MembercompanyproductsController } from './controller/membercompanyproducts.controller';
import { MembercompanyproductsService } from './service/membercompanyproducts.service';

@Module({
  imports: [TypeOrmModule.forFeature([MembercompanyproductEntity])],
  controllers: [MembercompanyproductsController],
  providers: [MembercompanyproductsService],
})
export class MembercompanyproductsModule { }
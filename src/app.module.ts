import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MembersModule } from './members/members.module';
import { CorporationsModule } from './corporations/corporations.module';
import { SalestasksModule } from './salestasks/salestasks.module';
import { SaleslistsModule } from './saleslists/saleslists.module';
import { MembercompanyproductsModule } from './membercompanyproducts/membercompanyproducts.module';
import { SalesCorporationstaffsModule } from './salescorporationstaffs/salescorporationstaffs.module';
import { MemberSalestasksModule } from './membersalestasks/membersalestasks.module';
import { CompanystaffsModule } from './companystaffs/companystaffs.module';
import { ActionlogsModule } from './actionlogs/actionlogs.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: "ec2-43-207-203-185.ap-northeast-1.compute.amazonaws.com",
      port: 3306,
      username: "root",
      password: "1234",
      database: "lisconeDb",
      entities: [__dirname + '/**/entities/*.entity{.ts,.js}'],
      synchronize: false, // 개발 환경에서만 사용하세요. 프로덕션 환경에서는 false로 설정하는 것이 좋습니다.
    }),
    MembersModule,
    CorporationsModule,
    SalestasksModule,
    SaleslistsModule,
    MembercompanyproductsModule,
    SalesCorporationstaffsModule,
    MemberSalestasksModule,
    CompanystaffsModule,
    ActionlogsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

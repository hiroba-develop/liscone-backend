import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CorporationsModule } from './corporations/corporations.module';
import { CorporationstaffsModule } from './corporationstaffs/corporationstaffs.module';
import { MembercompanyproductsModule } from './membercompanyproducts/membercompanyproducts.module';
import { MembersModule } from './members/members.module';
import { MemberSalestasksModule } from './membersalestasks/membersalestasks.module';
import { SalesCorporationstaffsModule } from './salescorporationstaffs/salescorporationstaffs.module';
import { SaleslistsModule } from './saleslists/saleslists.module';
import { SalestasksModule } from './salestasks/salestasks.module';
import { ConfigModule } from '@nestjs/config';
import { ActionlogsModule } from './actionlogs/actionlogs.module';
import { RecruitModule } from './recruit/recruit.module';
import { AutoFormSendModule } from './autoFormSend/autoFormSend.module';
import { CompanyModule } from './company/company.module';
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: process.env.NODE_ENV === 'dev' ? 'dev.env' : 'prod.env',
    }),
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT),
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      entities: ['dist/**/*.entity{.ts,.js}'],
      synchronize: false, // 本番環境ではfalse
      logging: ['query', 'error'],
    }),
    // UsersModule,
    MembersModule,
    CorporationsModule,
    SalestasksModule,
    SaleslistsModule,
    MembercompanyproductsModule,
    SalesCorporationstaffsModule,
    MemberSalestasksModule,
    CorporationstaffsModule,
    ActionlogsModule,
    RecruitModule,
    AutoFormSendModule,
    CompanyModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

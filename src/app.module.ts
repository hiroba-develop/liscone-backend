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
// import { UsersModule } from './users/users.module';
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: process.env.NODE_ENV === 'dev' ? 'dev.env' : 'prod.env',
      ignoreEnvFile: process.env.NODE_ENV === 'prod',
    }),
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT),
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      logging: ['query', 'error'],
      entities: ['dist/**/*.entity{.ts,.js}'],
      synchronize: false, // 개발 환경에서만 사용하세요. 프로덕션 환경에서는 false로 설정하는 것이 좋습니다.
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
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

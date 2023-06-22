import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { MembersModule } from './members/members.module';
import { CorporationsModule } from './corporations/corporations.module';
import { SalestasksModule } from './salestasks/salestasks.module';
import { SaleslistsModule } from './saleslists/saleslists.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: "ec2-35-78-238-15.ap-northeast-1.compute.amazonaws.com",
      port: 3306,
      username: "root",
      password: "1234",
      database: "lisconeDB",
      entities: [__dirname + '/**/entities/*.entity{.ts,.js}'],
      synchronize: false, // 개발 환경에서만 사용하세요. 프로덕션 환경에서는 false로 설정하는 것이 좋습니다.
    }),
    UsersModule,
    MembersModule,
    CorporationsModule,
    SalestasksModule,
    SaleslistsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

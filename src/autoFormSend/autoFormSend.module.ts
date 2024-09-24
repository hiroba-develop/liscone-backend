import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AutoFormSendEntity } from './entities/autoFormSend.entity';
import { AutoFormSendLogEntity } from './entities/autoFormSendLog.entity';
import { AutoFormSendController } from './controller/autoFormSend.controller';
import { AutoFormSendService } from './service/autoFormSend.service';

@Module({
  imports: [TypeOrmModule.forFeature([AutoFormSendEntity, AutoFormSendLogEntity])],
  controllers: [AutoFormSendController],
  providers: [AutoFormSendService],
})
export class AutoFormSendModule {}

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ActionlogEntity } from './entities/actionlogs.entity';
import { ActionlogsController } from './controller/actionlogs.controller';
import { ActionlogsService } from './service/actionlogs.service';

@Module({
  imports: [TypeOrmModule.forFeature([ActionlogEntity])],
  controllers: [ActionlogsController],
  providers: [ActionlogsService],
})
export class ActionlogsModule {}

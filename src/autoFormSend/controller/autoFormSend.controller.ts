import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { AutoFormSendEntity } from '../entities/autoFormSend.entity';
import { AutoFormSendService } from '../service/autoFormSend.service';
@Controller('autoFormSend')
export class AutoFormSendController {
  constructor(private readonly autoformsendService: AutoFormSendService) {}

  @Get('/autoFormSendList')
  getcorporationId(
    @Query('companyCode') companyCode: string,
  ): Promise<AutoFormSendEntity[]> {
    console.log('getAutoFormSendList');
    return this.autoformsendService.findByAutoFormSendList(companyCode);
  }

  @Post('/form')
  async postTest(@Body() data: any): Promise<AutoFormSendEntity[]> {
    try {
      console.log(data);
      // insertForm の処理が完了するのを待つ  
      const InsertformResult: string =
        await this.autoformsendService.insertForm(data);
      console.log('InsertformResult', InsertformResult);

      const formResult = await this.autoformsendService.form(
        data,
        InsertformResult,
      );
      console.log(formResult);

      return data; // 必要に応じて返すデータを変更
    } catch (error) {
      console.error('Error inserting form:', error);
      throw error; // エラーハンドリングを適切に行う
    }
  }
}

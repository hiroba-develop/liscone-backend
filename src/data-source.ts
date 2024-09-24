import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';

// `AppModule`で環境変数を読み込む設定をしているため、ConfigServiceを使って読み込む
const configService = new ConfigService();

export const AppDataSource = new DataSource({
  type: 'mysql',
  host: configService.get('DB_HOST'),
  port: parseInt(configService.get('DB_PORT')),
  username: configService.get('DB_USERNAME'),
  password: configService.get('DB_PASSWORD'),
  database: configService.get('DB_NAME'),
  entities: ['dist/**/*.entity{.ts,.js}'],
  logging: ['query', 'error'],
  synchronize: false, // 本番環境ではfalseに設定
});

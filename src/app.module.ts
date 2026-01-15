// import { Module } from '@nestjs/common';
// import { AppController } from './app.controller';
// import { AppService } from './app.service';

// @Module({
//   imports: [],
//   controllers: [AppController],
//   providers: [AppService],
// })
// export class AppModule {}
import { Module } from '@nestjs/common'; 
import { ConfigModule, ConfigService } from '@nestjs/config'; 
import { MongooseModule } from '@nestjs/mongoose'; 
import { ProductsModule } from './products/products.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';


@Module({ 
  imports: [ 
    // โหลดไฟล์ .env 
    ConfigModule.forRoot({ isGlobal: true }), 

    // เชื่อมต่อ MongoDB โดยดึงค่าจาก ConfigService 
    MongooseModule.forRootAsync({ 
      imports: [ConfigModule], 
      useFactory: async (configService: ConfigService) => ({ 
        uri: configService.get<string>('MONGO_URI'), 

      }), 
      inject: [ConfigService], 
    }), ProductsModule, 
        // เปิดให้เข้าถึงรูปภาพผ่าน Browser
    ServeStaticModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const uploadDest = config.get<string>('UPLOAD_DEST') || 'uploads';
        // รองรับทั้ง "uploads" และ "./uploads"
        const normalized = uploadDest.replace(/^\.\/+/, '');
        return [
          {
            rootPath: join(process.cwd(), normalized),
            serveRoot: '/uploads',
          },
        ];
      },
    }),

  ], 
}) 
export class AppModule { } 

//.env
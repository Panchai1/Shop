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
  ], 
}) 
export class AppModule { } 

//.env
// import { NestFactory } from '@nestjs/core';
// import { AppModule } from './app.module';

// async function bootstrap() {
//   const app = await NestFactory.create(AppModule);
//   await app.listen(process.env.PORT ?? 3000);
// }
// bootstrap();
import { ValidationPipe } from '@nestjs/common'; 
import { NestFactory } from '@nestjs/core'; 
import { AppModule } from './app.module'; 

async function bootstrap() { 
  const app = await NestFactory.create(AppModule); 

  // เปิดใช้ ValidationPipe 
  app.useGlobalPipes(new ValidationPipe({ 
    whitelist: true, // ตัด field แปลกปลอมทิ้งอัตโนมัติ 
    forbidNonWhitelisted: true // (Optional) แจ้ง Error ถ้ามี field แปลกปลอม 
  })); 

 app.enableCors(); 
  await app.listen(process.env.PORT ?? 3000); 
} 
bootstrap(); 
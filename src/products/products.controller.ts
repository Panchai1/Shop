import { Controller, Get, Post, Body, Patch, Param, Delete,Query,UseInterceptors,
   UploadedFile, ParseFilePipe,
  MaxFileSizeValidator,
 } from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Express } from 'express';
import { PRODUCT_IMAGE } from './products.constants';



@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  // @Post()  //อันที่ใช้ตัวเเรก
  // create(@Body() createProductDto: CreateProductDto) {
  //   return this.productsService.create(createProductDto);
  // }
  @Get()
findProducts(
  @Query('keyword') keyword?: string,
  @Query('minPrice') minPrice?: number,
  @Query('maxPrice') maxPrice?: number,
  @Query('sort') sort?: 'asc' | 'desc',
) {
  return this.productsService.search({
    keyword,
    minPrice,
    maxPrice,
    sort,
  });
}

  @Get()
  findAll() {
    return this.productsService.findAll();
  }

  // @Get(':id')
  // findOne(@Param('id') id: string) {
  //   return this.productsService.findOne(+id);
  // }

  // @Patch(':id')
  // update(@Param('id') id: string, @Body() updateProductDto: UpdateProductDto) {
  //   return this.productsService.update(+id, updateProductDto);
  // }

  // @Delete(':id')
  // remove(@Param('id') id: string) {
  //   return this.productsService.remove(+id);
  // }
   @Get(':id') 
  findOne(@Param('id') id: string) { 
    return this.productsService.findOne(id); 
  } 

  @Patch(':id') 
  update(@Param('id') id: string, @Body() updateProductDto: UpdateProductDto) { 
    return this.productsService.update(id, updateProductDto); 
  } 

  @Delete(':id') 
  remove(@Param('id') id: string) { 
    return this.productsService.remove(id); 
  } 

    @Post()
  @UseInterceptors(FileInterceptor('image')) // ชื่อฟิลด์ที่รับไฟล์จาก form-data “image”
  create(
    @Body() dto: CreateProductDto,
    @UploadedFile(
      new ParseFilePipe({
        fileIsRequired: false,
        validators: [
          new MaxFileSizeValidator({ maxSize: PRODUCT_IMAGE.MAX_SIZE })
        ],
      }),
    )
    file?: Express.Multer.File,
  ) {
    return this.productsService.create(dto,file);
  }
}

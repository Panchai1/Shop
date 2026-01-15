// import { Injectable } from '@nestjs/common';
// import { CreateProductDto } from './dto/create-product.dto';
// import { UpdateProductDto } from './dto/update-product.dto';

// @Injectable()
// export class ProductsService {
//   create(createProductDto: CreateProductDto) {
//     return 'This action adds a new product';
//   }

//   findAll() {
//     return `This action returns all products`;
//   }

//   findOne(id: number) {
//     return `This action returns a #${id} product`;
//   }

//   update(id: number, updateProductDto: UpdateProductDto) {
//     return `This action updates a #${id} product`;
//   }

//   remove(id: number) {
//     return `This action removes a #${id} product`;
//   }
// }
import { Injectable, NotFoundException,InternalServerErrorException } from '@nestjs/common'; 
import { InjectModel } from '@nestjs/mongoose'; 
import { Model } from 'mongoose'; 
import { CreateProductDto } from './dto/create-product.dto'; 
import { UpdateProductDto } from './dto/update-product.dto'; 
import { Product } from './entities/product.entity'; 
import type { Express } from 'express';
import { safeUnlinkByRelativePath } from '../common/utils/file.utils';


@Injectable() 
export class ProductsService { 
  // Inject Product Model เข้ามาใช้งาน โดยเก็บไว้ในตัวแปรชื่อ productModel 
  constructor( 
    @InjectModel(Product.name) private productModel: Model<Product>, 
  ) {} 
  // --- สร้างสินค้า (Create) ---  เป็นตัวเก่าของฟังก์ชัน create ด้านบน
  // async = ฟังก์ชันแบบอะซิงโครนัส เพื่อไม่ต้องรอการทำงานของ Database 
  // async create(createProductDto: CreateProductDto, file?: Express.Multer.File): Promise<Product> { 
  //   // สร้างอินสแตนซ์ของโมเดลด้วยข้อมูลจาก DTO (JSON) 
  //   const createdProduct = new this.productModel(createProductDto); 
  //   // บันทึกลง Database และคืนค่ากลับ 
  //   return createdProduct.save();  
  // } 
    private toPublicImagePath(filePath: string): string {
    const normalized = filePath.replace(/\\/g, '/'); // กัน Windows path
    // ตัด 'uploads/' หรือ './uploads/' ออกให้หมด
    return normalized
      .replace(/^\.?\/?uploads\//, '')
      .replace(/^uploads\//, '');
  }

  // --- สร้างสินค้า (Create) ---
  async create(dto: CreateProductDto, file?: Express.Multer.File) {
    const diskPath = file?.path?.replace(/\\/g, '/'); // เช่น uploads/products/uuid.jpg
    const imageUrl = diskPath ? this.toPublicImagePath(diskPath) : undefined; // products/uuid.jpg

    try {
      return await this.productModel.create({
        ...(dto as any),
        ...(imageUrl ? { imageUrl } : {}),
      });
    } catch (err) {
      if (diskPath) await safeUnlinkByRelativePath(diskPath); // ลบ “disk path” เท่านั้น
      throw new InternalServerErrorException('Create product failed');
    }
  }

  // --- ดึงข้อมูลทั้งหมด (Read All) --- 
  // Promise = สัญญาว่าจะคืนค่าในอนาคต (หลังจากรอการทำงานของ Database เสร็จ) 
  async findAll(): Promise<Product[]> { 
    // ใช้ .exec() เพื่อรันคำสั่ง Query และคืนค่า 
    return this.productModel.find().exec(); 
  } 
  // --- ดึงข้อมูลรายตัว (Read One) --- 
  async findOne(id: string): Promise<Product> { 
    // await รอผลลัพธ์จากการค้นหาใน Database เพื่อเก็บลงตัวแปร product ไปตรวจสอบต่อ 
    const product = await this.productModel.findById(id).exec(); 

    // ดัก Error: ถ้าหาไม่เจอ ให้โยน Error 404 ออกไป 
    if (!product) { 
      throw new NotFoundException(`Product with ID ${id} not found`); 
    } 
    return product; 

  } 
  // --- แก้ไขข้อมูล (Update) --- 
  async update(id: string, updateProductDto: UpdateProductDto): Promise<Product> { 
    const updatedProduct = await this.productModel 
      .findByIdAndUpdate( 
        id,  
        updateProductDto,  
        { new: true } // สำคัญ!: Option นี้บอกให้คืนค่าข้อมูล "ใหม่" หลังแก้แล้วกลับมา (ถ้าไม่ใส่จะได้ค่าเก่า) 
      ) 
      .exec(); 
    // ดัก Error: ถ้าหาไม่เจอ 
    if (!updatedProduct) { 
      throw new NotFoundException(`Product with ID ${id} not found`); 
    } 
    return updatedProduct; 
  } 
  // --- ลบข้อมูล (Delete) --- 
  async remove(id: string): Promise<Product> { 
    const deletedProduct = await this.productModel.findByIdAndDelete(id).exec(); 

    // ดัก Error: ถ้าหาไม่เจอ 
    if (!deletedProduct) { 
      throw new NotFoundException(`Product with ID ${id} not found`); 
    } 
    return deletedProduct; 
  } 
  async search(filters: {
  keyword?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: 'asc' | 'desc';
}) {
  const query: any = {};

  // 🔍 ค้นหาจากชื่อสินค้า
  if (filters.keyword) {
    query.name = { $regex: filters.keyword, $options: 'i' };
  }

  // 💰 ช่วงราคา
  if (filters.minPrice || filters.maxPrice) {
    query.price = {};
    if (filters.minPrice !== undefined) {
      query.price.$gte = Number(filters.minPrice);
    }
    if (filters.maxPrice !== undefined) {
      query.price.$lte = Number(filters.maxPrice);
    }
  }

  // ↕️ เรียงราคา
  const sortOption: Record<string, 1 | -1> =
    filters.sort === 'desc'
      ? { price: -1 }
      : { price: 1 };

  return this.productModel.find(query).sort(sortOption);
}





} 
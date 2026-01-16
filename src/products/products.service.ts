import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Product } from './entities/product.entity';
import type { Express } from 'express';
import { safeUnlinkByRelativePath } from '../common/utils/file.utils';

@Injectable()
export class ProductsService {
  constructor(
    @InjectModel(Product.name) private productModel: Model<Product>,
  ) {}

  private toPublicImagePath(filePath: string): string {
    const normalized = filePath.replace(/\\/g, '/');
    return normalized
      .replace(/^\.?\/?uploads\//, '')
      .replace(/^uploads\//, '');
  }

  // ✅ CREATE
  async create(dto: CreateProductDto, file?: Express.Multer.File) {
    const diskPath = file?.path?.replace(/\\/g, '/');
    const imageUrl = diskPath
      ? this.toPublicImagePath(diskPath)
      : undefined;

    try {
      return await this.productModel.create({
        ...(dto as any),
        ...(imageUrl ? { imageUrl } : {}),
      });
    } catch (err) {
      if (diskPath) {
        await safeUnlinkByRelativePath(diskPath);
      }
      throw new InternalServerErrorException('Create product failed');
    }
  }

  // ✅ READ ALL + FILTER
  async findAll(query: any): Promise<Product[]> {
    const { name, minPrice, maxPrice, sort, order } = query;
    const filter: any = {};

    if (name) {
      filter.name = { $regex: name, $options: 'i' };
    }

    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }

    const sortOptions: any = {};
    if (sort) {
      sortOptions[sort] = order === 'desc' ? -1 : 1;
    }

    return this.productModel.find(filter).sort(sortOptions).exec();
  }

  // ✅ READ ONE (ตัวที่ขาดไป)
  async findOne(id: string): Promise<Product> {
    const product = await this.productModel.findById(id).exec();

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    return product;
  }

  // ✅ UPDATE
 

  // ✅ DELETE
  async remove(id: string): Promise<Product> {
    const deletedProduct = await this.productModel
      .findByIdAndDelete(id)
      .exec();

    if (!deletedProduct) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    return deletedProduct;
  }

  async update(
  id: string,
  updateProductDto: UpdateProductDto,
  file?: Express.Multer.File,
): Promise<Product> {
  const updateData: any = { ...updateProductDto };

  // โหลดสินค้าที่มีอยู่เพื่อลบรูปเก่า (ถ้ามี)
  const existingProduct = await this.productModel.findById(id).exec();
  if (!existingProduct) {
    throw new NotFoundException(`Product with ID ${id} not found`);
  }

  // ถ้ามีไฟล์ใหม่ ให้เตรียมค่า imageUrl และอัปเดตในฐานข้อมูล
  if (file) {
    const newDiskPath = file.path?.replace(/\\/g, '/');
    const newImageUrl = newDiskPath ? this.toPublicImagePath(newDiskPath) : undefined;
    updateData.imageUrl = newImageUrl;

    try {
      const updatedProduct = await this.productModel
        .findByIdAndUpdate(
          id,
          { $set: updateData }, // update เฉพาะ field ที่ส่งมา
          { new: true, runValidators: true },
        )
        .exec();

      if (!updatedProduct) {
        if (newDiskPath) await safeUnlinkByRelativePath(newDiskPath);
        throw new NotFoundException(`Product with ID ${id} not found`);
      }

      // ลบไฟล์เก่า (อยู่ในโฟลเดอร์ uploads) — ignore ENOENT
      if (existingProduct.imageUrl) {
        await safeUnlinkByRelativePath(`uploads/${existingProduct.imageUrl}`);
      }

      return updatedProduct;
    } catch (err) {
      if (newDiskPath) await safeUnlinkByRelativePath(newDiskPath);
      throw new InternalServerErrorException('Update product failed');
    }
  }

  // กรณีไม่มีไฟล์ใหม่ — อัปเดตปกติ
  const updatedProduct = await this.productModel
    .findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true },
    )
    .exec();

  if (!updatedProduct) {
    throw new NotFoundException(`Product with ID ${id} not found`);
  }

  return updatedProduct;
}
  // ✅ SEARCH
  async search(filters: {
    keyword?: string;
    minPrice?: number;
    maxPrice?: number;
    sort?: 'asc' | 'desc';
  }) {
    const query: any = {};
      // คำค้นหา
    if (filters.keyword) {
      query.name = { $regex: filters.keyword, $options: 'i' };
    }
     //ช่วงราคาที่กรอง
    if (filters.minPrice || filters.maxPrice) {
      query.price = {};
      if (filters.minPrice !== undefined) {
        query.price.$gte = Number(filters.minPrice);
      }
      if (filters.maxPrice !== undefined) {
        query.price.$lte = Number(filters.maxPrice);
      }
    }

    const sortOption: Record<string, 1 | -1> =
  filters.sort === 'desc'
    ? { price: -1 }
    : { price: 1 };
    return this.productModel.find(query).sort(sortOption).exec();
  }
}

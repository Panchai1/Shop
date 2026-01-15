// export class CreateProductDto {}
// src/products/dto/create-product.dto.ts 
import { IsNotEmpty, IsString, IsNumber, Min, IsOptional, IsArray, Max } from 'class-validator'; 

export class CreateProductDto { 

    @IsNotEmpty() 
    @IsString() 
    name: string; 

    @IsNotEmpty() 
    @IsNumber() 
    @Min(0) 
    @Max(500000)
    price: number; 

    @IsOptional() 
    @IsString() 
    description?: string; 


    @IsOptional() 
    @IsString({ each: true }) 
    @IsArray()
    color?: string[];

} 
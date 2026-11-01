import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { PrismaService } from './prisma/prisma.service.js';

type ProductInput = Record<string, unknown>;

function isObject(value: unknown): value is ProductInput {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    const products = await this.prisma.product.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return products.map((product) => this.toResponse(product));
  }

  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) throw new NotFoundException(`Product ${id} was not found.`);
    return this.toResponse(product);
  }

  async create(input: unknown) {
    if (!isObject(input)) {
      throw new BadRequestException('A product object is required.');
    }

    const name = this.requiredString(input.name, 'name');
    const category = this.requiredString(input.category, 'category');
    const price = this.requiredNumber(input.price, 'price');
    const stock = input.stock === undefined ? 0 : this.integer(input.stock, 'stock');
    if (price <= 0) throw new BadRequestException('price must be greater than 0.');
    if (stock < 0) throw new BadRequestException('stock cannot be negative.');
    await this.requireCategory(category);

    const product = await this.prisma.product.create({
      data: {
        id: `p-${randomUUID()}`,
        name,
        category,
        price,
        stock,
        brand: this.optionalString(input.brand, 'Independent'),
        oldPrice:
          input.oldPrice === undefined || input.oldPrice === null
            ? null
            : this.requiredNumber(input.oldPrice, 'oldPrice'),
        rating: input.rating === undefined ? 0 : this.requiredNumber(input.rating, 'rating'),
        reviews: input.reviews === undefined ? 0 : this.integer(input.reviews, 'reviews'),
        featured: this.optionalBoolean(input.featured, false, 'featured'),
        bestSeller: this.optionalBoolean(input.bestSeller, false, 'bestSeller'),
        badge: this.optionalString(input.badge, ''),
        color: this.optionalString(input.color, 'sand'),
        image: this.optionalString(input.image, '') || null,
        description: this.optionalString(input.description, ''),
      },
    });

    return this.toResponse(product);
  }

  async update(id: string, input: unknown) {
    if (!isObject(input)) {
      throw new BadRequestException('A product object is required.');
    }
    await this.findOne(id);

    const data: {
      name?: string;
      category?: string;
      brand?: string;
      price?: number;
      oldPrice?: number | null;
      rating?: number;
      reviews?: number;
      stock?: number;
      featured?: boolean;
      bestSeller?: boolean;
      badge?: string;
      color?: string;
      image?: string | null;
      description?: string;
    } = {};

    if (input.name !== undefined) data.name = this.requiredString(input.name, 'name');
    if (input.category !== undefined) {
      data.category = this.requiredString(input.category, 'category');
      await this.requireCategory(data.category);
    }
    if (input.brand !== undefined) data.brand = this.requiredString(input.brand, 'brand');
    if (input.price !== undefined) {
      data.price = this.requiredNumber(input.price, 'price');
      if (data.price <= 0) throw new BadRequestException('price must be greater than 0.');
    }
    if (input.oldPrice !== undefined) {
      data.oldPrice = input.oldPrice === null ? null : this.requiredNumber(input.oldPrice, 'oldPrice');
    }
    if (input.rating !== undefined) data.rating = this.requiredNumber(input.rating, 'rating');
    if (input.reviews !== undefined) data.reviews = this.integer(input.reviews, 'reviews');
    if (input.stock !== undefined) {
      data.stock = this.integer(input.stock, 'stock');
      if (data.stock < 0) throw new BadRequestException('stock cannot be negative.');
    }
    if (input.featured !== undefined) data.featured = this.optionalBoolean(input.featured, false, 'featured');
    if (input.bestSeller !== undefined) data.bestSeller = this.optionalBoolean(input.bestSeller, false, 'bestSeller');
    if (input.badge !== undefined) data.badge = this.requiredString(input.badge, 'badge');
    if (input.color !== undefined) data.color = this.requiredString(input.color, 'color');
    if (input.image !== undefined) data.image = input.image === null ? null : this.requiredString(input.image, 'image');
    if (input.description !== undefined) data.description = this.requiredString(input.description, 'description');

    const product = await this.prisma.product.update({ where: { id }, data });
    return this.toResponse(product);
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.product.delete({ where: { id } });
    return { id, deleted: true };
  }

  private async requireCategory(name: string) {
    const category = await this.prisma.category.findUnique({ where: { name } });
    if (!category) {
      throw new NotFoundException(
        `Category "${name}" was not found. Create it in the admin Categories page first.`,
      );
    }
    return category;
  }

  private requiredString(value: unknown, field: string): string {
    if (typeof value !== 'string' || !value.trim()) {
      throw new BadRequestException(`${field} must be a non-empty string.`);
    }
    return value.trim();
  }

  private requiredNumber(value: unknown, field: string): number {
    if (typeof value !== 'number' || !Number.isFinite(value)) {
      throw new BadRequestException(`${field} must be a valid number.`);
    }
    return value;
  }

  private integer(value: unknown, field: string): number {
    const number = this.requiredNumber(value, field);
    if (!Number.isInteger(number)) {
      throw new BadRequestException(`${field} must be a whole number.`);
    }
    return number;
  }

  private optionalString(value: unknown, fallback: string): string {
    if (value === undefined || value === null) return fallback;
    return this.requiredString(value, 'value');
  }

  private optionalBoolean(value: unknown, fallback: boolean, field: string): boolean {
    if (value === undefined || value === null) return fallback;
    if (typeof value !== 'boolean') {
      throw new BadRequestException(`${field} must be true or false.`);
    }
    return value;
  }

  private toResponse(product: {
    id: string;
    name: string;
    category: string;
    brand: string;
    price: number;
    oldPrice: number | null;
    rating: number;
    reviews: number;
    stock: number;
    featured: boolean;
    bestSeller: boolean;
    badge: string;
    color: string;
    image: string | null;
    description: string;
  }) {
    return {
      id: product.id,
      name: product.name,
      category: product.category,
      brand: product.brand,
      price: product.price,
      oldPrice: product.oldPrice,
      rating: product.rating,
      reviews: product.reviews,
      stock: product.stock,
      featured: product.featured,
      bestSeller: product.bestSeller,
      badge: product.badge,
      color: product.color,
      ...(product.image ? { image: product.image } : {}),
      description: product.description,
    };
  }
}

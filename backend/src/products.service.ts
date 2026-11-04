import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { Prisma } from './generated/prisma/client.js';
import { PrismaService } from './prisma/prisma.service.js';

type ProductInput = Record<string, unknown>;

export interface ProductListQuery {
  page?: string;
  limit?: string;
  q?: string;
  search?: string;
  category?: string;
  brand?: string;
  minPrice?: string;
  maxPrice?: string;
  rating?: string;
  inStock?: string;
  sort?: string;
  orderBy?: string;
  order?: string;
  direction?: string;
}

function isObject(value: unknown): value is ProductInput {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function parseInteger(value: string | undefined, field: string, fallback: number): number {
  if (value === undefined || value.trim() === '') return fallback;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) {
    throw new BadRequestException(`${field} must be a positive whole number.`);
  }
  return parsed;
}

function parseNonNegativeNumber(
  value: string | undefined,
  field: string,
): number | undefined {
  if (value === undefined || value.trim() === '') return undefined;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new BadRequestException(`${field} must be a non-negative number.`);
  }
  return parsed;
}

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: ProductListQuery = {}) {
    const page = parseInteger(query.page, 'page', 1);
    const limit = parseInteger(query.limit, 'limit', 8);
    if (limit > 100) {
      throw new BadRequestException('limit cannot be greater than 100.');
    }

    const search = (query.q ?? query.search)?.trim();
    if (search && search.length > 120) {
      throw new BadRequestException('Search text cannot exceed 120 characters.');
    }

    const minPrice = parseNonNegativeNumber(query.minPrice, 'minPrice');
    const maxPrice = parseNonNegativeNumber(query.maxPrice, 'maxPrice');
    const rating = parseNonNegativeNumber(query.rating, 'rating');
    if (minPrice !== undefined && maxPrice !== undefined && minPrice > maxPrice) {
      throw new BadRequestException('minPrice cannot be greater than maxPrice.');
    }

    let inStock: boolean | undefined;
    if (query.inStock !== undefined) {
      if (['true', '1'].includes(query.inStock)) inStock = true;
      else if (['false', '0'].includes(query.inStock)) inStock = false;
      else throw new BadRequestException('inStock must be true or false.');
    }

    const where: Prisma.ProductWhereInput = {
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { category: { contains: search, mode: 'insensitive' } },
              { brand: { contains: search, mode: 'insensitive' } },
              { description: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
      ...(query.category?.trim() && query.category.trim().toLowerCase() !== 'all'
        ? { category: query.category.trim() }
        : {}),
      ...(query.brand?.trim() && query.brand.trim().toLowerCase() !== 'all'
        ? { brand: query.brand.trim() }
        : {}),
      ...(minPrice !== undefined || maxPrice !== undefined
        ? {
            price: {
              ...(minPrice !== undefined ? { gte: minPrice } : {}),
              ...(maxPrice !== undefined ? { lte: maxPrice } : {}),
            },
          }
        : {}),
      ...(rating !== undefined ? { rating: { gte: rating } } : {}),
      ...(inStock ? { stock: { gt: 0 } } : {}),
    };

    const orderDirection =
      (query.order ?? query.direction ?? 'asc').toLowerCase() === 'desc' ? 'desc' : 'asc';

    let orderBy: Prisma.ProductOrderByWithRelationInput[];

    if (query.orderBy) {
      const field = query.orderBy.trim();
      const allowedFields = ['updatedAt', 'createdAt', 'price', 'rating', 'name', 'category', 'stock', 'featured'];
      if (!allowedFields.includes(field)) {
        throw new BadRequestException(
          `Unsupported orderBy field: ${field}. Allowed fields: ${allowedFields.join(', ')}.`,
        );
      }
      orderBy = [
        { [field]: orderDirection },
        ...(field !== 'updatedAt' ? [{ updatedAt: 'desc' as const }] : []),
        { createdAt: 'desc' as const },
      ];
    } else {
      const sort = query.sort ?? 'featured';
      const allowedSorts = [
        'updatedAt',
        'updated',
        'newest',
        'featured',
        'price-low',
        'price-high',
        'rating',
      ];
      if (!allowedSorts.includes(sort)) {
        throw new BadRequestException('Unsupported product sort order.');
      }

      switch (sort) {
        case 'price-low':
          orderBy = [{ price: 'asc' }, { updatedAt: 'desc' }, { createdAt: 'desc' }];
          break;
        case 'price-high':
          orderBy = [{ price: 'desc' }, { updatedAt: 'desc' }, { createdAt: 'desc' }];
          break;
        case 'rating':
          orderBy = [{ rating: 'desc' }, { updatedAt: 'desc' }, { createdAt: 'desc' }];
          break;
        case 'updatedAt':
        case 'updated':
          orderBy = [{ updatedAt: orderDirection }, { createdAt: 'desc' }];
          break;
        case 'newest':
          orderBy = [{ createdAt: orderDirection }];
          break;
        case 'featured':
        default:
          orderBy = [{ featured: 'desc' }, { createdAt: 'desc' }];
          break;
      }
    }

    const total = await this.prisma.product.count({ where });
    const totalPages = Math.ceil(total / limit);
    const currentPage = Math.min(page, Math.max(totalPages, 1));
    const products = await this.prisma.product.findMany({
      where,
      orderBy,
      skip: (currentPage - 1) * limit,
      take: limit,
    });

    return {
      items: products.map((product) => this.toResponse(product)),
      page: currentPage,
      limit,
      total,
      totalPages,
    };
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

    const product = await this.prisma.product.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date(),
      },
    });
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
    createdAt?: Date;
    updatedAt?: Date;
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
      ...(product.createdAt ? { createdAt: product.createdAt } : {}),
      ...(product.updatedAt ? { updatedAt: product.updatedAt } : {}),
    };
  }
}

import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from './generated/prisma/client.js';
import { PrismaService } from './prisma/prisma.service.js';
import { StoreService } from './store.service.js';

export interface InventoryQuery {
  page?: string;
  limit?: string;
  q?: string;
  search?: string;
  status?: string;
  sort?: string;
  orderBy?: string;
  order?: string;
  direction?: string;
}

function parseInteger(value: string | undefined, field: string, fallback: number): number {
  if (value === undefined || value.trim() === '') return fallback;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) {
    throw new BadRequestException(`${field} must be a positive whole number.`);
  }
  return parsed;
}

@Injectable()
export class InventoryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storeService: StoreService,
  ) {}

  async findAll(query: InventoryQuery = {}) {
    const page = parseInteger(query.page, 'page', 1);
    const limit = parseInteger(query.limit, 'limit', 10);
    if (limit > 100) {
      throw new BadRequestException('limit cannot exceed 100.');
    }

    const search = (query.q ?? query.search)?.trim();
    if (search && search.length > 120) {
      throw new BadRequestException('Search text cannot exceed 120 characters.');
    }

    const status = query.status?.trim().toLowerCase();

    const where: Prisma.ProductWhereInput = {
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { category: { contains: search, mode: 'insensitive' } },
              { brand: { contains: search, mode: 'insensitive' } },
              { id: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
      ...(status === 'out'
        ? { stock: 0 }
        : status === 'low'
          ? { stock: { gt: 0, lte: 10 } }
          : status === 'in-stock'
            ? { stock: { gt: 0 } }
            : {}),
    };

    const orderDirection =
      (query.order ?? query.direction ?? 'asc').toLowerCase() === 'desc' ? 'desc' : 'asc';

    let orderBy: Prisma.ProductOrderByWithRelationInput[];

    const sortField = query.orderBy ?? query.sort ?? 'name';
    switch (sortField) {
      case 'stock':
        orderBy = [{ stock: orderDirection }, { name: 'asc' }];
        break;
      case 'sku':
      case 'id':
        orderBy = [{ id: orderDirection }];
        break;
      case 'price':
        orderBy = [{ price: orderDirection }, { name: 'asc' }];
        break;
      case 'status':
        orderBy = [{ stock: orderDirection }, { name: 'asc' }];
        break;
      case 'updatedAt':
        orderBy = [{ updatedAt: orderDirection }, { name: 'asc' }];
        break;
      case 'name':
      default:
        orderBy = [{ name: orderDirection }];
        break;
    }

    const [total, lowStockCount, outOfStockCount, stockSum] = await Promise.all([
      this.prisma.product.count({ where }),
      this.prisma.product.count({ where: { stock: { gt: 0, lte: 10 } } }),
      this.prisma.product.count({ where: { stock: 0 } }),
      this.prisma.product.aggregate({ _sum: { stock: true } }),
    ]);

    const totalPages = Math.ceil(total / limit) || 1;
    const currentPage = Math.min(page, totalPages);

    const products = await this.prisma.product.findMany({
      where,
      orderBy,
      skip: (currentPage - 1) * limit,
      take: limit,
    });

    return {
      items: products.map((product) => ({
        id: product.id,
        name: product.name,
        category: product.category,
        brand: product.brand,
        price: product.price,
        stock: product.stock,
        color: product.color,
        image: product.image,
        description: product.description,
        createdAt: product.createdAt,
        updatedAt: product.updatedAt,
      })),
      page: currentPage,
      limit,
      total,
      totalPages,
      lowStockCount,
      outOfStockCount,
      totalStock: stockSum._sum.stock ?? 0,
    };
  }

  async updateStock(id: string, stockValue: unknown) {
    const stock = Number(stockValue);
    if (!Number.isInteger(stock) || stock < 0) {
      throw new BadRequestException('stock must be a non-negative whole number.');
    }

    const existing = await this.prisma.product.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Product ${id} not found.`);
    }

    const updated = await this.prisma.product.update({
      where: { id },
      data: {
        stock,
        updatedAt: new Date(),
      },
    });

    return {
      id: updated.id,
      name: updated.name,
      category: updated.category,
      brand: updated.brand,
      price: updated.price,
      stock: updated.stock,
      color: updated.color,
      image: updated.image,
      updatedAt: updated.updatedAt,
    };
  }
}

import { BadRequestException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { ProductsService } from './products.service.js';
import { PrismaService } from './prisma/prisma.service.js';

describe('ProductsService', () => {
  async function createService() {
    const prisma = {
      product: {
        count: vi.fn().mockResolvedValue(17),
        findMany: vi.fn().mockResolvedValue([
          {
            id: 'p-1',
            name: 'Ceramic Mug',
            category: 'Home',
            brand: 'Goodthings',
            price: 1299,
            oldPrice: null,
            rating: 4.8,
            reviews: 10,
            stock: 3,
            featured: true,
            bestSeller: false,
            badge: '',
            color: 'sand',
            image: null,
            description: '',
          },
        ]),
      },
    };
    const moduleRef = await Test.createTestingModule({
      providers: [
        ProductsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    return { service: moduleRef.get(ProductsService), prisma };
  }

  it('filters and paginates products in the database query', async () => {
    const { service, prisma } = await createService();

    await expect(
      service.findAll({
        page: '2',
        limit: '8',
        q: 'mug',
        category: 'Home',
        minPrice: '500',
        maxPrice: '2000',
        rating: '4',
        inStock: 'true',
        sort: 'rating',
      }),
    ).resolves.toMatchObject({
      page: 2,
      limit: 8,
      total: 17,
      totalPages: 3,
      items: [{ id: 'p-1', name: 'Ceramic Mug' }],
    });

    expect(prisma.product.findMany).toHaveBeenCalledWith({
      where: {
        OR: [
          { name: { contains: 'mug', mode: 'insensitive' } },
          { category: { contains: 'mug', mode: 'insensitive' } },
          { brand: { contains: 'mug', mode: 'insensitive' } },
          { description: { contains: 'mug', mode: 'insensitive' } },
        ],
        category: 'Home',
        price: { gte: 500, lte: 2000 },
        rating: { gte: 4 },
        stock: { gt: 0 },
      },
      orderBy: [{ rating: 'desc' }, { updatedAt: 'desc' }, { createdAt: 'desc' }],
      skip: 8,
      take: 8,
    });
  });

  it('rejects page sizes above the configured maximum', async () => {
    const { service, prisma } = await createService();

    await expect(service.findAll({ limit: '101' })).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(prisma.product.count).not.toHaveBeenCalled();
  });
});

import { BadRequestException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { InventoryService } from './inventory.service.js';
import { PrismaService } from './prisma/prisma.service.js';
import { StoreService } from './store.service.js';

describe('InventoryService', () => {
  async function createService() {
    const prisma = {
      product: {
        count: vi.fn().mockImplementation((args) => {
          if (args?.where?.stock === 0) return Promise.resolve(2);
          if (args?.where?.stock?.lte === 10) return Promise.resolve(4);
          return Promise.resolve(15);
        }),
        aggregate: vi.fn().mockResolvedValue({
          _sum: { stock: 245 },
        }),
        findMany: vi.fn().mockResolvedValue([
          {
            id: 'p-1',
            name: 'Everyday Ceramic Mug',
            category: 'Home',
            brand: 'Goodthings',
            price: 1299,
            stock: 42,
            color: 'sand',
            image: null,
            description: '',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ]),
        findUnique: vi.fn().mockResolvedValue({
          id: 'p-1',
          name: 'Everyday Ceramic Mug',
          stock: 42,
        }),
        update: vi.fn().mockImplementation(({ where, data }) =>
          Promise.resolve({
            id: where.id,
            name: 'Everyday Ceramic Mug',
            category: 'Home',
            brand: 'Goodthings',
            price: 1299,
            stock: data.stock,
            color: 'sand',
            image: null,
            updatedAt: new Date(),
          }),
        ),
      },
    };

    const storeService = {
      getStore: vi.fn(),
      updateStoreValue: vi.fn(),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        InventoryService,
        { provide: PrismaService, useValue: prisma },
        { provide: StoreService, useValue: storeService },
      ],
    }).compile();

    return { service: moduleRef.get(InventoryService), prisma };
  }

  it('paginates and returns inventory summary metrics', async () => {
    const { service, prisma } = await createService();

    const result = await service.findAll({
      page: '1',
      limit: '10',
      q: 'mug',
      status: 'in-stock',
    });

    expect(result).toMatchObject({
      page: 1,
      limit: 10,
      total: 15,
      totalPages: 2,
      lowStockCount: 4,
      outOfStockCount: 2,
      totalStock: 245,
      items: [{ id: 'p-1', stock: 42 }],
    });

    expect(prisma.product.findMany).toHaveBeenCalled();
  });

  it('updates stock successfully', async () => {
    const { service, prisma } = await createService();

    const updated = await service.updateStock('p-1', 50);
    expect(updated).toMatchObject({
      id: 'p-1',
      stock: 50,
    });
    expect(prisma.product.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'p-1' },
        data: expect.objectContaining({ stock: 50 }),
      }),
    );
  });

  it('rejects negative stock', async () => {
    const { service } = await createService();

    await expect(service.updateStock('p-1', -5)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });
});

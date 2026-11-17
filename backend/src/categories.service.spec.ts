import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { CategoriesService } from './categories.service.js';
import { PrismaService } from './prisma/prisma.service.js';

describe('CategoriesService', () => {
  async function createService() {
    const prisma = {
      category: {
        findMany: vi.fn().mockResolvedValue([
          {
            id: 'category-home',
            name: 'Home',
            icon: '⌂',
            _count: { products: 5 },
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ]),
        findFirst: vi.fn().mockImplementation(({ where }) => {
          const match = where?.OR?.some(
            (cond: { id?: string; name?: string }) =>
              cond.id === 'category-home' || cond.name === 'Home',
          );
          if (match) {
            return Promise.resolve({
              id: 'category-home',
              name: 'Home',
              icon: '⌂',
              _count: { products: 5 },
              createdAt: new Date(),
              updatedAt: new Date(),
            });
          }
          return Promise.resolve(null);
        }),
        findUnique: vi.fn().mockImplementation(({ where }) => {
          if (where?.name === 'Existing') {
            return Promise.resolve({
              id: 'category-existing',
              name: 'Existing',
            });
          }
          return Promise.resolve(null);
        }),
        update: vi.fn().mockImplementation(({ where, data }) => {
          return Promise.resolve({
            id: where.id,
            name: data.name || 'Home',
            icon: data.icon !== undefined ? data.icon : '⌂',
            _count: { products: 5 },
            createdAt: new Date(),
            updatedAt: new Date(),
          });
        }),
        delete: vi.fn().mockResolvedValue({ id: 'category-home' }),
      },
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        CategoriesService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    return {
      service: moduleRef.get(CategoriesService),
      prisma,
    };
  }

  it('updates category name and icon successfully', async () => {
    const { service, prisma } = await createService();

    const result = await service.update('category-home', {
      name: 'Home Living',
      icon: '🛋️',
    });

    expect(result.name).toBe('Home Living');
    expect(result.icon).toBe('🛋️');
    expect(prisma.category.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'category-home' },
        data: expect.objectContaining({
          name: 'Home Living',
          icon: '🛋️',
        }),
      }),
    );
  });

  it('rejects duplicate category name on update', async () => {
    const { service } = await createService();

    await expect(
      service.update('category-home', { name: 'Existing' }),
    ).rejects.toThrow(BadRequestException);
  });
});

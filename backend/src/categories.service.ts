import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service.js';

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    const categories = await this.prisma.category.findMany({
      include: {
        _count: {
          select: { products: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    return categories.map((category) => ({
      id: category.id,
      name: category.name,
      icon: category.icon,
      productCount: category._count.products,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt,
    }));
  }

  async findOne(id: string) {
    const category = await this.prisma.category.findFirst({
      where: {
        OR: [{ id }, { name: id }],
      },
      include: {
        _count: {
          select: { products: true },
        },
      },
    });

    if (!category) {
      throw new NotFoundException(`Category not found.`);
    }

    return {
      id: category.id,
      name: category.name,
      icon: category.icon,
      productCount: category._count.products,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt,
    };
  }

  async create(body: { name?: string; icon?: string }) {
    if (!body?.name?.trim()) {
      throw new BadRequestException('Category name is required.');
    }
    const name = body.name.trim();
    const id = `category-${encodeURIComponent(name.toLowerCase().replace(/\s+/g, '-'))}`;
    const category = await this.prisma.category.upsert({
      where: { name },
      create: {
        id,
        name,
        icon: body.icon?.trim() || null,
      },
      update: {
        icon: body.icon !== undefined ? body.icon.trim() || null : undefined,
      },
      include: {
        _count: {
          select: { products: true },
        },
      },
    });

    return {
      id: category.id,
      name: category.name,
      icon: category.icon,
      productCount: category._count.products,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt,
    };
  }

  async update(id: string, body: { name?: string; icon?: string }) {
    const existing = await this.findOne(id);
    const newName = body.name !== undefined ? body.name.trim() : undefined;

    if (newName !== undefined && !newName) {
      throw new BadRequestException('Category name cannot be empty.');
    }

    if (newName && newName !== existing.name) {
      const duplicate = await this.prisma.category.findUnique({
        where: { name: newName },
      });
      if (duplicate && duplicate.id !== existing.id) {
        throw new BadRequestException(`Category "${newName}" already exists.`);
      }
    }

    const updated = await this.prisma.category.update({
      where: { id: existing.id },
      data: {
        ...(newName ? { name: newName } : {}),
        ...(body.icon !== undefined ? { icon: body.icon.trim() || null } : {}),
      },
      include: {
        _count: {
          select: { products: true },
        },
      },
    });

    return {
      id: updated.id,
      name: updated.name,
      icon: updated.icon,
      productCount: updated._count.products,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
    };
  }

  async remove(id: string) {
    const category = await this.findOne(id);
    if (category.productCount > 0) {
      throw new BadRequestException(
        `Cannot delete category "${category.name}" because it contains ${category.productCount} product(s).`,
      );
    }
    await this.prisma.category.delete({ where: { id: category.id } });
    return { success: true, message: `Category "${category.name}" deleted.` };
  }
}

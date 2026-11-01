import {
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { Prisma } from './generated/prisma/client.js';
import { PrismaService } from './prisma/prisma.service.js';

export const STORE_KEYS = [
  'users',
  'currentUser',
  'products',
  'categories',
  'cart',
  'wishlist',
  'orders',
  'checkoutDraft',
] as const;

export type StoreKey = (typeof STORE_KEYS)[number];
export type AppStore = Record<StoreKey, unknown>;

const emptyStore: AppStore = {
  users: [],
  currentUser: null,
  products: [],
  categories: [],
  cart: [],
  wishlist: [],
  orders: [],
  checkoutDraft: {},
};

type JsonObject = Record<string, unknown>;

function asRecords(value: unknown): JsonObject[] {
  return Array.isArray(value)
    ? value.filter(
        (item): item is JsonObject =>
          item !== null && typeof item === 'object' && !Array.isArray(item),
      )
    : [];
}

function toJsonValue(value: unknown): Prisma.InputJsonValue {
  try {
    const serialized = JSON.stringify(value);

    if (serialized === undefined) {
      throw new Error('Value is not JSON serializable');
    }

    return JSON.parse(serialized) as Prisma.InputJsonValue;
  } catch {
    throw new InternalServerErrorException(
      'Store value must be valid JSON.',
    );
  }
}

@Injectable()
export class StoreService {
  constructor(private readonly prisma: PrismaService) {}

  async getStore(): Promise<AppStore> {
    const row = await this.prisma.appStore.findUnique({
      where: { id: 1 },
    });

    const savedStore = row
      ? (row.data as unknown as AppStore)
      : emptyStore;
    const [productCount, categoryCount] = await Promise.all([
      this.prisma.product.count(),
      this.prisma.category.count(),
    ]);

    // Migrate the old JSON catalog on first read after the relational tables
    // have been created. This preserves products already saved in app_store.
    if (productCount === 0 && categoryCount === 0) {
      await this.saveCatalog(savedStore.categories, savedStore.products);
    }

    return {
      ...emptyStore,
      ...savedStore,
      ...(await this.readCatalog()),
    };
  }

  async initializeStore(
    initialStore: Partial<AppStore>,
  ): Promise<AppStore> {
    const existing = await this.prisma.appStore.findUnique({
      where: { id: 1 },
    });

    if (existing?.initialized) {
      return this.getStore();
    }

    const store = {
      ...emptyStore,
      ...(existing?.data as Partial<AppStore> | undefined),
      ...initialStore,
    };

    await this.saveCatalog(store.categories, store.products);

    const saved = await this.prisma.appStore.upsert({
      where: { id: 1 },
      create: {
        id: 1,
        data: toJsonValue(store),
        initialized: true,
      },
      update: {
        data: toJsonValue(store),
        initialized: true,
      },
    });

    return {
      ...(saved.data as unknown as AppStore),
      ...(await this.readCatalog()),
    };
  }

  async updateStoreValue(
    key: StoreKey,
    value: unknown,
  ): Promise<AppStore> {
    const existing = await this.prisma.appStore.findUnique({
      where: { id: 1 },
    });
    const currentStore = existing
      ? (existing.data as unknown as AppStore)
      : emptyStore;

    if (key === 'products') {
      const { categories } = await this.readCatalog();
      await this.saveCatalog(categories, value);
    } else if (key === 'categories') {
      const { products } = await this.readCatalog();
      await this.saveCatalog(value, products);
    }

    const nextStore: AppStore = {
      ...emptyStore,
      ...currentStore,
      [key]: value,
    };

    await this.prisma.appStore.upsert({
      where: { id: 1 },
      create: {
        id: 1,
        data: toJsonValue(nextStore),
        initialized: true,
      },
      update: {
        data: toJsonValue(nextStore),
        initialized: true,
      },
    });

    return {
      ...nextStore,
      ...(await this.readCatalog()),
    };
  }

  private async readCatalog(): Promise<
    Pick<AppStore, 'products' | 'categories'>
  > {
    const [categories, products] = await Promise.all([
      this.prisma.category.findMany({ orderBy: { createdAt: 'asc' } }),
      this.prisma.product.findMany({ orderBy: { createdAt: 'desc' } }),
    ]);

    return {
      categories: categories.map(({ id, name, icon }) => ({
        id,
        name,
        ...(icon ? { icon } : {}),
      })),
      products: products.map((product) => ({
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
      })),
    };
  }

  private async saveCatalog(
    categoriesValue: unknown,
    productsValue: unknown,
  ): Promise<void> {
    const categories = asRecords(categoriesValue);
    const products = asRecords(productsValue);

    await this.prisma.$transaction(async (transaction) => {
      for (const category of categories) {
        if (typeof category.id !== 'string' || typeof category.name !== 'string') {
          continue;
        }

        await transaction.category.upsert({
          where: { id: category.id },
          create: {
            id: category.id,
            name: category.name,
            icon: typeof category.icon === 'string' ? category.icon : null,
          },
          update: {
            name: category.name,
            icon: typeof category.icon === 'string' ? category.icon : null,
          },
        });
      }

      for (const product of products) {
        if (
          typeof product.id !== 'string' ||
          typeof product.name !== 'string' ||
          typeof product.category !== 'string'
        ) {
          continue;
        }

        const category =
          (await transaction.category.findUnique({
            where: { name: product.category },
          })) ??
          (await transaction.category.create({
            data: {
              id: `category-${encodeURIComponent(product.category)}`,
              name: product.category,
            },
          }));

        const data = {
          name: product.name,
          category: category.name,
          brand: typeof product.brand === 'string' ? product.brand : 'Independent',
          price: Number(product.price) || 0,
          oldPrice:
            product.oldPrice === null || product.oldPrice === undefined
              ? null
              : Number(product.oldPrice) || 0,
          rating: Number(product.rating) || 0,
          reviews: Math.max(0, Math.trunc(Number(product.reviews) || 0)),
          stock: Math.max(0, Math.trunc(Number(product.stock) || 0)),
          featured: product.featured === true,
          bestSeller: product.bestSeller === true,
          badge: typeof product.badge === 'string' ? product.badge : '',
          color: typeof product.color === 'string' ? product.color : 'sand',
          image: typeof product.image === 'string' ? product.image : null,
          description:
            typeof product.description === 'string' ? product.description : '',
        };

        await transaction.product.upsert({
          where: { id: product.id },
          create: { id: product.id, ...data },
          update: data,
        });
      }

      const productIds = products
        .map((product) => product.id)
        .filter((id): id is string => typeof id === 'string');
      await transaction.product.deleteMany({
        where: productIds.length ? { id: { notIn: productIds } } : {},
      });

      const categoryIds = categories
        .map((category) => category.id)
        .filter((id): id is string => typeof id === 'string');
      await transaction.category.deleteMany({
        where: {
          ...(categoryIds.length ? { id: { notIn: categoryIds } } : {}),
          products: { none: {} },
        },
      });
    });
  }
}

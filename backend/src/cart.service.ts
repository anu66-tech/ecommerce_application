import { BadRequestException, Injectable } from '@nestjs/common';
import { StoreService } from './store.service.js';

export interface CartItem {
  productId: string;
  quantity: number;
  [key: string]: unknown;
}

@Injectable()
export class CartService {
  constructor(private readonly storeService: StoreService) {}

  private async getCartItems(): Promise<CartItem[]> {
    const store = await this.storeService.getStore();
    return Array.isArray(store.cart) ? (store.cart as CartItem[]) : [];
  }

  async findAll() {
    const items = await this.getCartItems();
    return { items };
  }

  async add(item: { productId?: string; id?: string; quantity?: number }) {
    const productId = item.productId || item.id;
    if (!productId?.trim()) {
      throw new BadRequestException('productId is required.');
    }
    const quantity = Math.max(1, Number(item.quantity) || 1);
    const current = await this.getCartItems();
    const existingIndex = current.findIndex(
      (c) => (c.productId || c.id) === productId,
    );

    let next: CartItem[];
    if (existingIndex > -1) {
      next = current.map((c, i) =>
        i === existingIndex
          ? { ...c, quantity: Number(c.quantity || 0) + quantity }
          : c,
      );
    } else {
      next = [...current, { productId, quantity }];
    }

    await this.storeService.updateStoreValue('cart', next);
    return { items: next };
  }

  async updateQuantity(productId: string, quantity: number) {
    if (!productId?.trim()) {
      throw new BadRequestException('productId is required.');
    }
    const current = await this.getCartItems();
    let next: CartItem[];
    if (quantity <= 0) {
      next = current.filter((c) => (c.productId || c.id) !== productId);
    } else {
      next = current.map((c) =>
        (c.productId || c.id) === productId ? { ...c, quantity } : c,
      );
    }
    await this.storeService.updateStoreValue('cart', next);
    return { items: next };
  }

  async sync(items: unknown) {
    if (!Array.isArray(items)) {
      throw new BadRequestException('items must be an array of cart items.');
    }
    const next = items.map((item) => ({
      productId: item.productId || item.id,
      quantity: Math.max(1, Number(item.quantity) || 1),
    }));
    await this.storeService.updateStoreValue('cart', next);
    return { items: next };
  }

  async remove(productId: string) {
    if (!productId?.trim()) {
      throw new BadRequestException('productId is required.');
    }
    const current = await this.getCartItems();
    const next = current.filter((c) => (c.productId || c.id) !== productId);
    await this.storeService.updateStoreValue('cart', next);
    return { items: next };
  }

  async clear() {
    await this.storeService.updateStoreValue('cart', []);
    return { items: [] };
  }
}

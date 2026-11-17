import { BadRequestException, Injectable } from '@nestjs/common';
import { StoreService } from './store.service.js';

@Injectable()
export class WishlistService {
  constructor(private readonly storeService: StoreService) {}

  private async getWishlistItems(): Promise<string[]> {
    const store = await this.storeService.getStore();
    return Array.isArray(store.wishlist) ? (store.wishlist as string[]) : [];
  }

  async findAll() {
    const items = await this.getWishlistItems();
    return { items };
  }

  async add(productId: string) {
    if (!productId?.trim()) {
      throw new BadRequestException('productId is required.');
    }
    const current = await this.getWishlistItems();
    const id = productId.trim();
    const next = current.includes(id) ? current : [...current, id];
    await this.storeService.updateStoreValue('wishlist', next);
    return { items: next };
  }

  async remove(productId: string) {
    if (!productId?.trim()) {
      throw new BadRequestException('productId is required.');
    }
    const current = await this.getWishlistItems();
    const id = productId.trim();
    const next = current.filter((item) => item !== id);
    await this.storeService.updateStoreValue('wishlist', next);
    return { items: next };
  }

  async sync(items: unknown) {
    if (!Array.isArray(items)) {
      throw new BadRequestException('items must be an array of product IDs.');
    }
    const next = [...new Set(items.map(String))];
    await this.storeService.updateStoreValue('wishlist', next);
    return { items: next };
  }
}

import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service.js';
import { StoreService } from './store.service.js';

export interface OrderQuery {
  page?: string;
  limit?: string;
  status?: string;
  search?: string;
}

export interface OrderItem {
  id?: string;
  productId?: string;
  quantity: number;
  price?: number;
  name?: string;
  color?: string;
}

export interface OrderRecord {
  id: string;
  customer?: Record<string, unknown>;
  items?: OrderItem[];
  total?: number;
  subtotal?: number;
  shipping?: number;
  payment?: string;
  status?: string;
  createdAt?: string;
  [key: string]: unknown;
}

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storeService: StoreService,
  ) {}

  private async getOrdersList(): Promise<OrderRecord[]> {
    const store = await this.storeService.getStore();
    return Array.isArray(store.orders) ? (store.orders as OrderRecord[]) : [];
  }

  async findAll(query: OrderQuery = {}) {
    const allOrders = await this.getOrdersList();

    let filtered = [...allOrders];

    if (query.status && query.status !== 'All') {
      const targetStatus = query.status.toLowerCase();
      filtered = filtered.filter(
        (order) => String(order.status || '').toLowerCase() === targetStatus,
      );
    }

    if (query.search?.trim()) {
      const q = query.search.trim().toLowerCase();
      filtered = filtered.filter((order) => {
        const idMatch = String(order.id || '').toLowerCase().includes(q);
        const nameMatch = String(
          (order.customer as Record<string, unknown>)?.name || '',
        )
          .toLowerCase()
          .includes(q);
        const emailMatch = String(
          (order.customer as Record<string, unknown>)?.email || '',
        )
          .toLowerCase()
          .includes(q);
        return idMatch || nameMatch || emailMatch;
      });
    }

    // Sort newest first
    filtered.sort((a, b) => {
      const timeA = new Date(a.createdAt || 0).getTime();
      const timeB = new Date(b.createdAt || 0).getTime();
      return timeB - timeA;
    });

    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(query.limit) || 10));
    const total = filtered.length;
    const totalPages = Math.ceil(total / limit) || 1;
    const skip = (page - 1) * limit;
    const items = filtered.slice(skip, skip + limit);

    return {
      items,
      total,
      page,
      limit,
      totalPages,
    };
  }

  async findOne(id: string): Promise<OrderRecord> {
    const allOrders = await this.getOrdersList();
    const order = allOrders.find((item) => item.id === id);
    if (!order) {
      throw new NotFoundException(`Order ${id} not found.`);
    }
    return order;
  }

  async create(orderInput: Partial<OrderRecord>): Promise<OrderRecord> {
    if (!orderInput || typeof orderInput !== 'object') {
      throw new BadRequestException('Order data is required.');
    }

    const items = Array.isArray(orderInput.items) ? orderInput.items : [];
    if (!items.length) {
      throw new BadRequestException('Order must contain at least one item.');
    }

    // Decrement stock in transaction
    await this.prisma.$transaction(async (tx) => {
      for (const item of items) {
        const productId = item.productId || item.id;
        if (!productId) continue;
        const product = await tx.product.findUnique({ where: { id: productId } });
        if (product) {
          const qty = Math.max(1, Number(item.quantity) || 1);
          const newStock = Math.max(0, product.stock - qty);
          await tx.product.update({
            where: { id: productId },
            data: { stock: newStock, updatedAt: new Date() },
          });
        }
      }
    });

    const newOrder: OrderRecord = {
      id: orderInput.id || `order-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
      createdAt: orderInput.createdAt || new Date().toISOString(),
      status: orderInput.status || 'processing',
      total: Number(orderInput.total) || 0,
      customer: (orderInput.customer as Record<string, unknown>) || {},
      items,
      payment: orderInput.payment || 'card',
      shipping: Number(orderInput.shipping) || 0,
    };

    const currentOrders = await this.getOrdersList();
    const nextOrders = [newOrder, ...currentOrders.filter((o) => o.id !== newOrder.id)];

    await this.storeService.updateStoreValue('orders', nextOrders);
    return newOrder;
  }

  async updateStatus(id: string, status: string): Promise<OrderRecord> {
    if (!status?.trim()) {
      throw new BadRequestException('Order status is required.');
    }
    const currentOrders = await this.getOrdersList();
    const index = currentOrders.findIndex((order) => order.id === id);
    if (index === -1) {
      throw new NotFoundException(`Order ${id} not found.`);
    }

    const updatedOrder: OrderRecord = {
      ...currentOrders[index],
      status: status.trim(),
      updatedAt: new Date().toISOString(),
    };

    currentOrders[index] = updatedOrder;
    await this.storeService.updateStoreValue('orders', currentOrders);
    return updatedOrder;
  }
}

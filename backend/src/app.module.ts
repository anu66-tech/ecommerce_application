import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { StoreController } from './store.controller.js';
import { StoreService } from './store.service.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { ProductsController } from './products.controller.js';
import { ProductsService } from './products.service.js';
import { CategoriesController } from './categories.controller.js';
import { CategoriesService } from './categories.service.js';
import { InventoryController } from './inventory.controller.js';
import { InventoryService } from './inventory.service.js';
import { OrdersController } from './orders.controller.js';
import { OrdersService } from './orders.service.js';
import { WishlistController } from './wishlist.controller.js';
import { WishlistService } from './wishlist.service.js';
import { CartController } from './cart.controller.js';
import { CartService } from './cart.service.js';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';

@Module({
  imports: [PrismaModule],
  controllers: [
    AppController,
    StoreController,
    ProductsController,
    CategoriesController,
    InventoryController,
    OrdersController,
    WishlistController,
    CartController,
    AuthController,
  ],
  providers: [
    AppService,
    StoreService,
    ProductsService,
    CategoriesService,
    InventoryService,
    OrdersService,
    WishlistService,
    CartService,
    AuthService,
  ],
})
export class AppModule {}

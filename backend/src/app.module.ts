
import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { StoreController } from './store.controller.js';
import { StoreService } from './store.service.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { ProductsController } from './products.controller.js';
import { ProductsService } from './products.service.js';

@Module({
  imports: [PrismaModule],
  controllers: [AppController, StoreController, ProductsController],
  providers: [AppService, StoreService, ProductsService],
})
export class AppModule {}

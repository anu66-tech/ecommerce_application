import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
} from '@nestjs/common';
import { CartService } from './cart.service.js';

@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  findAll() {
    return this.cartService.findAll();
  }

  @Post()
  add(@Body() body: { productId?: string; id?: string; quantity?: number }) {
    return this.cartService.add(body);
  }

  @Put()
  sync(@Body() body: { items: any[] }) {
    return this.cartService.sync(body?.items ?? []);
  }

  @Patch(':id')
  updateQuantity(
    @Param('id') id: string,
    @Body() body: { quantity: number },
  ) {
    return this.cartService.updateQuantity(id, Number(body?.quantity) || 0);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.cartService.remove(id);
  }

  @Delete()
  clear() {
    return this.cartService.clear();
  }
}

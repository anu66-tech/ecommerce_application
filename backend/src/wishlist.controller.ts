import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { WishlistService } from './wishlist.service.js';

@Controller('wishlist')
export class WishlistController {
  constructor(private readonly wishlistService: WishlistService) {}

  @Get()
  findAll() {
    return this.wishlistService.findAll();
  }

  @Post()
  addOrSync(@Body() body: { productId?: string; items?: string[] }) {
    if (body?.items && Array.isArray(body.items)) {
      return this.wishlistService.sync(body.items);
    }
    return this.wishlistService.add(body?.productId ?? '');
  }

  @Put()
  sync(@Body() body: { items: string[] }) {
    return this.wishlistService.sync(body?.items ?? []);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.wishlistService.remove(id);
  }
}

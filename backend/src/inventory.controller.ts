import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Put,
  Query,
} from '@nestjs/common';
import { InventoryService, type InventoryQuery } from './inventory.service.js';

@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get()
  findAll(@Query() query: InventoryQuery) {
    return this.inventoryService.findAll(query);
  }

  @Patch(':id/stock')
  updateStock(@Param('id') id: string, @Body() body: { stock?: unknown }) {
    return this.inventoryService.updateStock(id, body?.stock);
  }

  @Put(':id/stock')
  putStock(@Param('id') id: string, @Body() body: { stock?: unknown }) {
    return this.inventoryService.updateStock(id, body?.stock);
  }

  @Patch(':id')
  patchProductStock(@Param('id') id: string, @Body() body: { stock?: unknown }) {
    return this.inventoryService.updateStock(id, body?.stock);
  }
}

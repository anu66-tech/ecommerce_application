import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Put,
  BadRequestException,
} from '@nestjs/common';
import { AppStore, STORE_KEYS, StoreKey, StoreService } from './store.service.js';

function isStoreKey(value: string): value is StoreKey {
  return STORE_KEYS.some((key) => key === value);
}

@Controller('store')
export class StoreController {
  constructor(private readonly storeService: StoreService) {}

  @Get()
  getStore(): Promise<AppStore> {
    return this.storeService.getStore();
  }

  @Put('initialize')
  @HttpCode(HttpStatus.OK)
  initializeStore(@Body() body: { store?: Partial<AppStore> }): Promise<AppStore> {
    if (!body?.store || typeof body.store !== 'object' || Array.isArray(body.store)) {
      throw new BadRequestException('A store object is required.');
    }
    return this.storeService.initializeStore(body.store);
  }

  @Put(':key')
  updateStoreValue(
    @Param('key') key: string,
    @Body() body: { value?: unknown },
  ): Promise<AppStore> {
    if (!isStoreKey(key)) {
      throw new BadRequestException(`Unsupported store key: ${key}`);
    }
    if (!body || !Object.prototype.hasOwnProperty.call(body, 'value')) {
      throw new BadRequestException('A value is required.');
    }
    return this.storeService.updateStoreValue(key, body.value);
  }
}

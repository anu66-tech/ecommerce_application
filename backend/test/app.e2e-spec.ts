import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module.js';
import { StoreService } from './../src/store.service.js';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;
  let storeData: Record<string, unknown>;

  beforeEach(async () => {
    storeData = { products: [] };
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(StoreService)
      .useValue({
        getStore: async () => storeData,
        initializeStore: async (initialStore: Record<string, unknown>) => {
          storeData = { ...storeData, ...initialStore };
          return storeData;
        },
        updateStoreValue: async (key: string, value: unknown) => {
          storeData = { ...storeData, [key]: value };
          return storeData;
        },
      })
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/ (GET)', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect('Hello World!');
  });

  it('/health (GET)', () => {
    return request(app.getHttpServer())
      .get('/health')
      .expect(200)
      .expect({ status: 'ok' });
  });

  it('/store (GET)', () => {
    return request(app.getHttpServer())
      .get('/store')
      .expect(200)
      .expect({ products: [] });
  });

  it('/store/:key (PUT)', () => {
    return request(app.getHttpServer())
      .put('/store/products')
      .send({ value: [{ id: 'p-1', name: 'Mug' }] })
      .expect(200)
      .expect({ products: [{ id: 'p-1', name: 'Mug' }] });
  });

  afterEach(async () => {
    await app.close();
  });
});

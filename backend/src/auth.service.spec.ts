import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AuthService } from './auth.service.js';
import { StoreService } from './store.service.js';

describe('AuthService', () => {
  async function createService() {
    let mockStore: Record<string, any> = {
      users: [
        {
          id: 'user-1',
          name: 'Jane Doe',
          email: 'jane@example.com',
          password: 'password123',
          role: 'customer',
        },
      ],
      currentUser: null,
      currentAdmin: null,
    };

    const storeService = {
      getStore: vi.fn().mockImplementation(() => Promise.resolve(mockStore)),
      updateStoreValue: vi.fn().mockImplementation((key, val) => {
        mockStore[key] = val;
        return Promise.resolve(mockStore);
      }),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: StoreService, useValue: storeService },
      ],
    }).compile();

    return {
      service: moduleRef.get(AuthService),
      storeService,
      getMockStore: () => mockStore,
    };
  }

  it('allows valid customer login', async () => {
    const { service, getMockStore } = await createService();

    const result = await service.customerLogin({
      email: 'jane@example.com',
      password: 'password123',
    });

    expect(result.success).toBe(true);
    expect(result.user.email).toBe('jane@example.com');
    expect(getMockStore().currentUser).toBeNull();
  });

  it('rejects customer login with wrong password', async () => {
    const { service } = await createService();

    await expect(
      service.customerLogin({
        email: 'jane@example.com',
        password: 'wrongpassword',
      }),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('rejects customer login with missing or invalid email', async () => {
    const { service } = await createService();

    await expect(
      service.customerLogin({
        email: '',
        password: 'password123',
      }),
    ).rejects.toThrow(BadRequestException);

    await expect(
      service.customerLogin({
        email: 'not-an-email',
        password: 'password123',
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('rejects customer login with missing password', async () => {
    const { service } = await createService();

    await expect(
      service.customerLogin({
        email: 'jane@example.com',
        password: '',
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('rejects customer login with unknown email', async () => {
    const { service } = await createService();

    await expect(
      service.customerLogin({
        email: 'unknown@example.com',
        password: 'password123',
      }),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('registers a new customer account', async () => {
    const { service, getMockStore } = await createService();

    const result = await service.customerRegister({
      name: 'John Smith',
      email: 'john@example.com',
      password: 'mypassword',
    });

    expect(result.success).toBe(true);
    expect(result.user.name).toBe('John Smith');
    expect(getMockStore().users).toHaveLength(2);
    expect(getMockStore().currentUser).toBeNull();
  });

  it('authenticates admin with valid credentials', async () => {
    const { service, getMockStore } = await createService();

    const result = await service.adminLogin({
      email: 'admin@gmail.com',
      password: 'admin123',
    });

    expect(result.success).toBe(true);
    expect(result.admin.role).toBe('admin');
    expect(result.admin.email).toBe('admin@gmail.com');
    expect(getMockStore().currentAdmin).toBeNull();
  });

  it('authenticates customer with customer@gmail.com credentials', async () => {
    const { service, getMockStore } = await createService();

    const result = await service.customerLogin({
      email: 'customer@gmail.com',
      password: 'customer123',
    });

    expect(result.success).toBe(true);
    expect(result.user.email).toBe('customer@gmail.com');
    expect(getMockStore().currentUser).toBeNull();
  });

  it('rejects the demo customer when the password is wrong', async () => {
    const { service, getMockStore } = await createService();
    getMockStore().users = getMockStore().users.filter(
      (user: { email: string }) => user.email !== 'customer@gmail.com',
    );

    await expect(
      service.customerLogin({
        email: 'customer@gmail.com',
        password: 'wrong-password',
      }),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('rejects legacy customer records without a password', async () => {
    const { service, getMockStore } = await createService();
    getMockStore().users[0].password = undefined;

    await expect(
      service.customerLogin({
        email: 'jane@example.com',
        password: 'any-password',
      }),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('rejects admin login with invalid password', async () => {
    const { service } = await createService();

    await expect(
      service.adminLogin({
        username: 'admin@gmail.com',
        password: 'badpassword',
      }),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('rejects admin login with missing fields or unauthorized username', async () => {
    const { service } = await createService();

    await expect(
      service.adminLogin({
        username: '',
        password: 'admin123',
      }),
    ).rejects.toThrow(BadRequestException);

    await expect(
      service.adminLogin({
        username: 'admin@gmail.com',
        password: '',
      }),
    ).rejects.toThrow(BadRequestException);

    await expect(
      service.adminLogin({
        username: 'intruder@gmail.com',
        password: 'admin123',
      }),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('generates a JWT token with 1 hour expiration for customer login', async () => {
    const { service } = await createService();

    const result = await service.customerLogin({
      email: 'jane@example.com',
      password: 'password123',
    });

    expect(result.token).toBeDefined();
    expect(typeof result.token).toBe('string');
    expect(result.expiresIn).toBe(3600);
    expect(result.expiresAt).toBeGreaterThan(Date.now());

    const session = await service.getSession(result.token);
    expect(session.valid).toBe(true);
    expect(session.currentUser?.email).toBe('jane@example.com');
    expect(session.expiresIn).toBeLessThanOrEqual(3600);
  });

  it('generates a JWT token with 1 hour expiration for admin login', async () => {
    const { service } = await createService();

    const result = await service.adminLogin({
      email: 'admin@gmail.com',
      password: 'admin123',
    });

    expect(result.token).toBeDefined();
    expect(typeof result.token).toBe('string');
    expect(result.expiresIn).toBe(3600);

    const session = await service.getSession(result.token);
    expect(session.valid).toBe(true);
    expect(session.currentAdmin?.email).toBe('admin@gmail.com');
    expect(session.currentAdmin?.role).toBe('admin');
  });

  it('rejects an invalid or tampered JWT token', async () => {
    const { service } = await createService();

    await expect(service.getSession('invalid.jwt.token')).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('authenticates customer via unifiedLogin', async () => {
    const { service } = await createService();

    const result = await service.unifiedLogin({
      email: 'jane@example.com',
      password: 'password123',
    });

    expect(result.success).toBe(true);
    expect(result.role).toBe('customer');
    if (result.role !== 'customer') throw new Error('Expected customer login result');
    expect(result.user?.email).toBe('jane@example.com');
  });

  it('authenticates admin via unifiedLogin with admin@gmail.com', async () => {
    const { service } = await createService();

    const result = await service.unifiedLogin({
      email: 'admin@gmail.com',
      password: 'admin123',
    });

    expect(result.success).toBe(true);
    expect(result.role).toBe('admin');
    if (result.role !== 'admin') throw new Error('Expected admin login result');
    expect(result.admin.email).toBe('admin@gmail.com');
  });
});

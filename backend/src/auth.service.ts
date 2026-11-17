import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import jwt from 'jsonwebtoken';
import { StoreService } from './store.service.js';

export interface CustomerUser {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: 'customer';
  createdAt?: string;
  address?: string;
  city?: string;
  postal?: string;
  country?: string;
}

export interface AdminUser {
  id: string;
  username: string;
  name: string;
  email: string;
  role: 'admin';
}

export interface JwtPayload {
  sub: string;
  email: string;
  role: 'customer' | 'admin';
  name: string;
  iat?: number;
  exp?: number;
}

export const JWT_SECRET =
  process.env.JWT_SECRET || 'goodthings-ecommerce-jwt-super-secret-key-2026';
export const JWT_EXPIRES_IN = '1h'; // 1 hour session time
export const JWT_EXPIRES_IN_SECONDS = 3600; // 3600 seconds = 1 hour

@Injectable()
export class AuthService {
  constructor(private readonly storeService: StoreService) {}

  generateToken(payload: {
    sub: string;
    email: string;
    role: 'customer' | 'admin';
    name: string;
  }) {
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
    const expiresAt = Date.now() + JWT_EXPIRES_IN_SECONDS * 1000;
    return {
      token,
      expiresIn: JWT_EXPIRES_IN_SECONDS,
      expiresAt,
    };
  }

  verifyToken(token: string): JwtPayload {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
      return decoded;
    } catch (err: any) {
      if (err?.name === 'TokenExpiredError') {
        throw new UnauthorizedException(
          'Session has expired (1 minute limit). Please log in again.',
        );
      }
      throw new UnauthorizedException('Invalid authentication token. Please log in again.');
    }
  }

  async getSession(token?: string) {
    if (token) {
      const payload = this.verifyToken(token);
      const store = await this.storeService.getStore();
      const users = (store.users as CustomerUser[]) || [];
      const user =
        payload.role === 'customer'
          ? users.find(
              (u) =>
                u.id === payload.sub ||
                u.email.toLowerCase() === payload.email.toLowerCase(),
            ) || {
              id: payload.sub,
              name: payload.name,
              email: payload.email,
              role: 'customer' as const,
            }
          : null;

      const admin =
        payload.role === 'admin'
          ? {
              id: payload.sub,
              username: 'admin',
              name: payload.name,
              email: payload.email,
              role: 'admin' as const,
            }
          : null;

      const now = Math.floor(Date.now() / 1000);
      const timeLeftSeconds = payload.exp
        ? Math.max(0, payload.exp - now)
        : JWT_EXPIRES_IN_SECONDS;

      return {
        valid: true,
        currentUser: user,
        currentAdmin: admin,
        expiresIn: timeLeftSeconds,
        expiresAt: payload.exp
          ? payload.exp * 1000
          : Date.now() + JWT_EXPIRES_IN_SECONDS * 1000,
        tokenPayload: payload,
      };
    }

    return {
      valid: false,
      currentUser: null,
      currentAdmin: null,
      expiresIn: 0,
      expiresAt: 0,
    };
  }

  async customerLogin(body: { email?: string; password?: string }) {
    const email = body?.email?.trim().toLowerCase();
    const password = body?.password?.trim();

    if (!email) {
      throw new BadRequestException('Customer email address is required.');
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new BadRequestException('Please enter a valid email address.');
    }
    if (!password) {
      throw new BadRequestException('Customer password is required.');
    }

    const store = await this.storeService.getStore();
    const users = (store.users as CustomerUser[]) || [];
    let user = users.find((u) => u.email.toLowerCase() === email);

    // Keep the demo customer available only with its actual demo credentials.
    if (!user && email === 'customer@gmail.com') {
      if (password !== 'customer123') {
        throw new UnauthorizedException('Incorrect password for this customer account.');
      }
      user = {
        id: 'user-customer',
        name: 'Customer',
        email: 'customer@gmail.com',
        password: 'customer123',
        role: 'customer',
        createdAt: new Date().toISOString(),
      };
      await this.storeService.updateStoreValue('users', [...users, user]);
    }

    if (!user) {
      throw new UnauthorizedException(
        'No customer account found with this email. Please register first or use customer@gmail.com.',
      );
    }

    if (!user.password || user.password !== password) {
      throw new UnauthorizedException('Incorrect password for this customer account.');
    }

    const tokenData = this.generateToken({
      sub: user.id,
      email: user.email,
      role: 'customer',
      name: user.name,
    });

    const { password: _, ...safeUser } = user;
    return {
      success: true,
      message: `Welcome back, ${user.name}!`,
      token: tokenData.token,
      expiresIn: tokenData.expiresIn,
      expiresAt: tokenData.expiresAt,
      user: safeUser,
    };
  }

  async customerRegister(body: { name?: string; email?: string; password?: string }) {
    const name = body?.name?.trim();
    const email = body?.email?.trim().toLowerCase();
    const password = body?.password?.trim() || '';

    if (!name) {
      throw new BadRequestException('Please provide your name.');
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new BadRequestException('A valid email address is required.');
    }
    if (password.length < 6) {
      throw new BadRequestException('Password must be at least 6 characters.');
    }

    const store = await this.storeService.getStore();
    const users = (store.users as CustomerUser[]) || [];
    const exists = users.some((u) => u.email.toLowerCase() === email);

    if (exists) {
      throw new BadRequestException('An account with this email already exists. Please log in.');
    }

    const newUser: CustomerUser = {
      id: `user-${Date.now()}`,
      name,
      email,
      password,
      role: 'customer',
      createdAt: new Date().toISOString(),
    };

    await this.storeService.updateStoreValue('users', [...users, newUser]);

    const tokenData = this.generateToken({
      sub: newUser.id,
      email: newUser.email,
      role: 'customer',
      name: newUser.name,
    });

    const { password: _, ...safeUser } = newUser;
    return {
      success: true,
      message: `Account created successfully. Welcome, ${name}!`,
      token: tokenData.token,
      expiresIn: tokenData.expiresIn,
      expiresAt: tokenData.expiresAt,
      user: safeUser,
    };
  }

  async adminLogin(body: { email?: string; username?: string; password?: string }) {
    const inputEmail = (body?.email || body?.username)?.trim().toLowerCase();
    const inputPassword = body?.password?.trim();

    if (!inputEmail) {
      throw new BadRequestException('Admin email is required.');
    }
    if (inputEmail.includes('@') && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inputEmail)) {
      throw new BadRequestException('Please provide a valid admin email format.');
    }
    if (!inputPassword) {
      throw new BadRequestException('Admin password is required.');
    }

    const isValidAdmin =
      inputEmail === 'admin@gmail.com' && inputPassword === 'admin123';

    if (!isValidAdmin) {
      throw new UnauthorizedException(
        'Invalid admin credentials. Use admin email "admin@gmail.com" and password "admin123".',
      );
    }

    const adminUser: AdminUser = {
      id: 'admin-studio',
      username: 'admin',
      name: 'Admin Manager',
      email: 'admin@gmail.com',
      role: 'admin',
    };

    const tokenData = this.generateToken({
      sub: adminUser.id,
      email: adminUser.email,
      role: 'admin',
      name: adminUser.name,
    });

    return {
      success: true,
      message: 'Admin authorization granted.',
      token: tokenData.token,
      expiresIn: tokenData.expiresIn,
      expiresAt: tokenData.expiresAt,
      admin: adminUser,
    };
  }

  async unifiedLogin(body: {
    email?: string;
    username?: string;
    password?: string;
    role?: 'customer' | 'admin' | 'auto';
  }) {
    const inputEmail = (body?.email || body?.username)?.trim().toLowerCase() || '';
    const selectedRole = body?.role || 'auto';

    if (
      selectedRole === 'admin' ||
      (selectedRole === 'auto' && inputEmail === 'admin@gmail.com') ||
      (!selectedRole && inputEmail === 'admin@gmail.com')
    ) {
      const res = await this.adminLogin(body);
      return { ...res, role: 'admin' as const };
    }

    const res = await this.customerLogin(body);
    return { ...res, role: 'customer' as const };
  }

  async logout(type: 'customer' | 'admin' | 'all' = 'all') {
    void type;
    return { success: true, message: 'Logged out successfully.' };
  }

  async updateCustomerProfile(body: {
    id?: string;
    name?: string;
    email?: string;
    address?: string;
    city?: string;
    postal?: string;
    country?: string;
  }) {
    const name = body?.name?.trim();
    const email = body?.email?.trim().toLowerCase();
    if (!name) throw new BadRequestException('Name is required.');
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new BadRequestException('A valid email address is required.');
    }
    const store = await this.storeService.getStore();
    const currentUser = (store.currentUser as CustomerUser) || null;
    const users = (store.users as CustomerUser[]) || [];
    const userId = body?.id || currentUser?.id || 'user-customer';
    const updatedUser = {
      ...(currentUser || {}),
      id: userId,
      name,
      email,
      role: 'customer' as const,
      address: body?.address ?? (currentUser as any)?.address,
      city: body?.city ?? (currentUser as any)?.city,
      postal: body?.postal ?? (currentUser as any)?.postal,
      country: body?.country ?? (currentUser as any)?.country,
    };
    const updatedUsers = users.map((u) => (u.id === userId ? { ...u, ...updatedUser } : u));
    if (!updatedUsers.some((u) => u.id === userId)) {
      updatedUsers.push(updatedUser);
    }
    await this.storeService.updateStoreValue('users', updatedUsers);
    await this.storeService.updateStoreValue('currentUser', updatedUser);
    return { success: true, message: 'Profile updated successfully.', user: updatedUser };
  }
}

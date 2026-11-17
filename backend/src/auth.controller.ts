import { Body, Controller, Get, Headers, Post, Put } from '@nestjs/common';
import { AuthService } from './auth.service.js';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('me')
  getSession(@Headers('authorization') authHeader?: string) {
    const token = authHeader?.startsWith('Bearer ')
      ? authHeader.slice(7).trim()
      : undefined;
    return this.authService.getSession(token);
  }

  @Post('customer/login')
  customerLogin(@Body() body: { email?: string; password?: string }) {
    return this.authService.customerLogin(body);
  }

  @Post('customer/register')
  customerRegister(
    @Body() body: { name?: string; email?: string; password?: string },
  ) {
    return this.authService.customerRegister(body);
  }

  @Put('customer/profile')
  updateProfile(
    @Body()
    body: {
      id?: string;
      name?: string;
      email?: string;
      address?: string;
      city?: string;
      postal?: string;
      country?: string;
    },
  ) {
    return this.authService.updateCustomerProfile(body);
  }

  @Post('admin/login')
  adminLogin(
    @Body() body: { email?: string; username?: string; password?: string },
  ) {
    return this.authService.adminLogin(body);
  }

  @Post('login')
  unifiedLogin(
    @Body()
    body: {
      email?: string;
      username?: string;
      password?: string;
      role?: 'customer' | 'admin' | 'auto';
    },
  ) {
    return this.authService.unifiedLogin(body);
  }

  @Post('logout')
  logout(@Body() body: { type?: 'customer' | 'admin' | 'all' }) {
    return this.authService.logout(body?.type || 'all');
  }
}

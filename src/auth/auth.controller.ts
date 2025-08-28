import {
  Controller,
  Request,
  Post,
  UseGuards,
  Body,
  HttpCode,
  HttpStatus,
  UseInterceptors,
  ClassSerializerInterceptor,
} from '@nestjs/common';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { LoginDto } from './dto/login.dto';
import { AuthResponse } from './interfaces/auth-response.interface';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { GetUser } from '@/common/decorators/get-user.decorator';
import { User } from '@/user/entities/user.entity';

@UseInterceptors(ClassSerializerInterceptor) // Exclude password from response
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @UseGuards(LocalAuthGuard)
  @Post('sign-in')
  @HttpCode(HttpStatus.OK)
  async signIn(
    @Request() req,
    @Body() loginDto: LoginDto,
  ): Promise<AuthResponse> {
    return this.authService.signIn(req.user);
  }

  @Post('sign-up')
  async signUp(@Body() registerDto: RegisterDto): Promise<AuthResponse> {
    return this.authService.signUp(registerDto);
  }

  @Post('refresh-token')
  @HttpCode(HttpStatus.OK)
  async refreshToken(
    @Body() refreshTokenDto: RefreshTokenDto,
  ): Promise<AuthResponse> {
    return this.authService.refreshToken(refreshTokenDto.refreshToken);
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(
    @Body() forgotPasswordDto: ForgotPasswordDto,
  ): Promise<{ message: string }> {
    return this.authService.forgotPassword(forgotPasswordDto);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(
    @Body() resetPasswordDto: ResetPasswordDto,
  ): Promise<{ message: string }> {
    return this.authService.resetPassword(resetPasswordDto);
  }

  @UseGuards(JwtAuthGuard)
  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  async changePassword(
    @GetUser() user: User,
    @Body() changePasswordDto: ChangePasswordDto,
  ): Promise<{ message: string }> {
    return this.authService.changePassword(user, changePasswordDto);
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(): Promise<{ message: string }> {
    return this.authService.logout();
  }
}

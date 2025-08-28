import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { UserService } from '@/user/user.service';
import { RegisterDto } from './dto/register.dto';
import { User } from '@/user/entities/user.entity';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { AuthResponse } from './interfaces/auth-response.interface';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { MailService } from '@/mail/mail.service';

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private readonly mailService: MailService,
  ) {}

  async validateUser(email: string, password: string): Promise<User | null> {
    try {
      const user = await this.userService.findByEmail(email);
      const isPasswordValid = await bcrypt.compare(password, user.password);

      if (isPasswordValid) {
        return user;
      }
    } catch (error) {
      // User not found or password invalid
      throw new UnauthorizedException('Invalid credentials');
    }

    return null;
  }

  async signIn(user: User): Promise<AuthResponse> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get('JWT_REFRESH_SECRET'),
      expiresIn: this.configService.get('JWT_REFRESH_EXPIRES_IN'),
    });

    return {
      user,
      access_token: accessToken,
      refresh_token: refreshToken,
    };
  }

  async signUp(registerDto: RegisterDto): Promise<AuthResponse> {
    const user = await this.userService.create({
      email: registerDto.email,
      username: registerDto?.username,
      password: registerDto.password,
      fullName: registerDto?.fullName,
      bio: registerDto?.bio,
    });

    return this.signIn(user);
  }

  async refreshToken(refreshToken: string): Promise<AuthResponse> {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get('JWT_REFRESH_SECRET'),
      });

      const user = await this.userService.findOne(payload.sub);
      return this.signIn(user);
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async forgotPassword(
    forgotPasswordDto: ForgotPasswordDto,
  ): Promise<{ message: string }> {
    try {
      const user = await this.userService.findByEmail(forgotPasswordDto.email);

      // Generate password reset token
      const resetToken = await this.userService.generatePasswordResetToken(
        user.id,
      );

      await this.mailService.sendEmail({
        to: user.email,
        subject: 'Password Reset',
        template: 'reset-token-mail',
        context: {
          username: user.username,
          resetToken: resetToken,
          frontendUrl: this.configService.get(
            'FRONTEND_URL',
            'http://localhost:3000',
          ),
        },
      });

      return {
        message:
          'Password reset token has been generated. Please check your email.',
      };
    } catch (error) {
      // Don't reveal whether user exists or not for security
      return {
        message: 'If the username exists, a password reset link has been sent.',
      };
    }
  }

  async resetPassword(
    resetPasswordDto: ResetPasswordDto,
  ): Promise<{ message: string }> {
    try {
      const user = await this.userService.findByResetToken(
        resetPasswordDto.token,
      );

      // Update the password
      await this.userService.updatePassword(
        user.id,
        resetPasswordDto.newPassword,
      );

      // Clear the reset token
      await this.userService.clearPasswordResetToken(user.id);

      return {
        message: 'Password has been successfully reset.',
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new BadRequestException('Invalid or expired reset token');
      }
      throw error;
    }
  }

  async changePassword(
    user: User,
    changePasswordDto: ChangePasswordDto,
  ): Promise<{ message: string }> {
    // Verify current password
    const isCurrentPasswordValid = await this.userService.validatePassword(
      user,
      changePasswordDto.currentPassword,
    );

    if (!isCurrentPasswordValid) {
      throw new BadRequestException('Current password is incorrect');
    }

    // Check if new password is different from current
    const isSamePassword = await bcrypt.compare(
      changePasswordDto.newPassword,
      user.password,
    );
    if (isSamePassword) {
      throw new BadRequestException(
        'New password must be different from current password',
      );
    }

    // Update password
    await this.userService.updatePassword(
      user.id,
      changePasswordDto.newPassword,
    );

    return {
      message: 'Password has been successfully changed.',
    };
  }

  async logout(): Promise<{ message: string }> {
    // In a real application, you might want to blacklist the token
    // For now, we'll just return a success message
    return { message: 'Successfully logged out' };
  }
}

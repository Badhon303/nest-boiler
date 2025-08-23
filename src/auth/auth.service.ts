import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { UserService } from '@/user/user.service';
import { RegisterDto } from './dto/register.dto';
import { User } from '@/user/entities/user.entity';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { AuthResponse } from './interfaces/auth-response.interface';

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
    private configService: ConfigService,
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

  async logout(): Promise<{ message: string }> {
    // In a real application, you might want to blacklist the token
    // For now, we'll just return a success message
    return { message: 'Successfully logged out' };
  }
}

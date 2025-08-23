import { User } from '@/user/entities/user.entity';

export interface AuthResponse {
  user: User;
  access_token: string;
  refresh_token: string;
}

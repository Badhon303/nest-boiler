// src/user-profile/user-profile.module.ts
import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserProfileService } from './user-profile.service';
import { UserProfileController } from './user-profile.controller';
import { UserProfile } from './entities/user-profile.entity';
import { UserModule } from '@/user/user.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserProfile]),
    forwardRef(() => UserModule),
  ],
  controllers: [UserProfileController],
  providers: [UserProfileService],
  exports: [UserProfileService],
})
export class UserProfileModule {}

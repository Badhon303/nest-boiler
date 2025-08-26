import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  OneToMany,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { Role } from '../../common/constants/roles.constant';
import { UserProfile } from '../../user-profile/entities/user-profile.entity';
import { Task } from '@/task/entities/task.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column({ nullable: true })
  username: string;

  @Column()
  @Exclude()
  password: string;

  @Column({
    type: 'text',
    enum: Role,
    default: Role.USER,
  })
  role: Role;

  @OneToOne(() => UserProfile, (profile) => profile.user)
  profile: UserProfile;

  @OneToMany(() => Task, (task) => task.owner)
  tasks: Task[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

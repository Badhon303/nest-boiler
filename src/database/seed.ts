import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../user/entities/user.entity';
// import { UserProfile } from '../../user-profile/entities/user-profile.entity';
import { Role } from '../common/constants/roles.constant';

async function seed() {
  const dataSource = new DataSource({
    type: 'sqlite',
    database: './db.sqlite',
    entities: [User],
    synchronize: true,
  });

  await dataSource.initialize();

  const userRepository = dataSource.getRepository(User);
  //   const userProfileRepository = dataSource.getRepository(UserProfile);

  // Check if admin user already exists
  const existingAdmin = await userRepository.findOne({
    where: { email: 'admin@example.com' },
  });

  if (!existingAdmin) {
    // Create admin user
    const hashedPassword = await bcrypt.hash('admin123', 10);
    const adminUser = userRepository.create({
      email: 'admin@example.com',
      password: hashedPassword,
      role: Role.ADMIN,
    });

    await userRepository.save(adminUser);
    // const savedAdmin = await userRepository.save(adminUser);

    // Create admin profile
    // const adminProfile = userProfileRepository.create({
    //   userId: savedAdmin.id,
    //   fullName: 'System Administrator',
    //   bio: 'Default admin user for the ToDo application',
    // });

    // await userProfileRepository.save(adminProfile);

    console.log('Admin user created successfully');
    console.log('Email: admin@example.com');
    console.log('Password: admin123');
  } else {
    console.log('Admin user already exists');
  }

  await dataSource.destroy();
}

seed().catch((error) => {
  console.error('Seeding failed:', error);
  process.exit(1);
});

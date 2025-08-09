import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  BeforeInsert,
  BeforeUpdate,
  Index
} from 'typeorm';
import { IsEmail, MinLength, IsNotEmpty } from 'class-validator';
import bcrypt from 'bcryptjs';

export enum Gender {
  MALE = 'male',
  FEMALE = 'female'
}

@Entity('users')
@Index(['email'], { unique: true })
@Index(['phoneNumber'], { unique: true })
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100 })
  @IsNotEmpty({ message: 'Full name is required' })
  fullName: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  email: string;

  @Column({ type: 'varchar', length: 255 })
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  @IsNotEmpty({ message: 'Password is required' })
  password: string;

  @Column({ type: 'varchar', length: 20, unique: true })
  @IsNotEmpty({ message: 'Phone number is required' })
  phoneNumber: string;

  @Column({ type: 'varchar', length: 100 })
  @IsNotEmpty({ message: 'Location is required' })
  location: string;

  @Column({
    type: 'enum',
    enum: Gender,
    default: Gender.MALE
  })
  @IsNotEmpty({ message: 'Gender is required' })
  gender: Gender;

  @Column({ type: 'boolean', default: false })
  isEmailVerified: boolean;

  @Column({ type: 'boolean', default: false })
  isPhoneVerified: boolean;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'timestamp', nullable: true })
  lastLoginAt: Date;

  @Column({ type: 'varchar', length: 255, nullable: true })
  refreshToken: string | null;

  @Column({ type: 'timestamp', nullable: true })
  refreshTokenExpiresAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Hash password before inserting/updating
  @BeforeInsert()
  @BeforeUpdate()
  async hashPassword() {
    if (this.password && this.password.length < 60) { // Only hash if not already hashed
      this.password = await bcrypt.hash(this.password, 12);
    }
  }

  // Method to compare password
  async comparePassword(candidatePassword: string): Promise<boolean> {
    return bcrypt.compare(candidatePassword, this.password);
  }

  // Method to get public user data (without sensitive information)
  toPublicJSON() {
    const { password, refreshToken, refreshTokenExpiresAt, ...publicData } = this;
    return publicData;
  }
} 
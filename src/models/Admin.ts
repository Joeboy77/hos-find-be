import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, BeforeInsert, BeforeUpdate } from 'typeorm';
import { IsEmail, MinLength, IsEnum } from 'class-validator';
import bcrypt from 'bcryptjs';
export enum AdminRole {
  ADMIN = 'admin'
}
@Entity('admins')
export class Admin {
  @PrimaryGeneratedColumn('uuid')
  id: string;
  @Column({ unique: true })
  @IsEmail()
  email: string;
  @Column()
  @MinLength(6)
  password: string;
  @Column()
  fullName: string;
  @Column({
    type: 'enum',
    enum: AdminRole,
    default: AdminRole.ADMIN
  })
  @IsEnum(AdminRole)
  role: AdminRole = AdminRole.ADMIN;
  @Column({ default: true })
  isActive: boolean;
  @Column({ nullable: true })
  lastLoginAt: Date;
  @Column({ type: 'varchar', length: 255, nullable: true })
  refreshToken: string | null;
  @CreateDateColumn()
  createdAt: Date;
  @UpdateDateColumn()
  updatedAt: Date;
  @BeforeInsert()
  @BeforeUpdate()
  async hashPassword() {
    if (this.password && !this.password.startsWith('$2a$') && !this.password.startsWith('$2b$')) {
      this.password = await bcrypt.hash(this.password, 12);
    }
  }
  async validatePassword(password: string): Promise<boolean> {
    return bcrypt.compare(password, this.password);
  }
  toPublicJSON() {
    const { password, ...publicData } = this;
    return publicData;
  }
} 
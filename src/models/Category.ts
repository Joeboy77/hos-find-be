import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany
} from 'typeorm';
import { IsNotEmpty } from 'class-validator';
import { Property } from './Property';

@Entity('categories')
export class Category {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100 })
  @IsNotEmpty({ message: 'Category name is required' })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  imageUrl: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  cloudinaryPublicId: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  type: string;

  @Column({ type: 'varchar', length: 50 })
  @IsNotEmpty({ message: 'Category icon is required' })
  icon: string;

  @Column({ type: 'varchar', length: 20 })
  @IsNotEmpty({ message: 'Category color is required' })
  color: string;

  @Column({ type: 'int', default: 0 })
  propertyCount: number;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'int', default: 0 })
  displayOrder: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => Property, property => property.category)
  properties: Property[];

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      imageUrl: this.imageUrl,
      type: this.type,
      icon: this.icon,
      color: this.color,
      propertyCount: this.propertyCount,
      isActive: this.isActive,
      displayOrder: this.displayOrder,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
} 
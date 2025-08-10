import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn
} from 'typeorm';
import { IsNotEmpty, IsUrl, IsNumber, IsPositive, Min, Max } from 'class-validator';
import { Category } from './Category';
export enum PropertyType {
  HOSTEL = 'hostel',
  HOTEL = 'hotel',
  HOMESTAY = 'homestay',
  APARTMENT = 'apartment',
  GUESTHOUSE = 'guesthouse'
}
export enum PropertyStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  MAINTENANCE = 'maintenance',
  BOOKED = 'booked'
}
@Entity('properties')
export class Property {
  @PrimaryGeneratedColumn('uuid')
  id: string;
  @Column({ type: 'varchar', length: 200 })
  @IsNotEmpty({ message: 'Property name is required' })
  name: string;
  @Column({ type: 'text' })
  @IsNotEmpty({ message: 'Property description is required' })
  description: string;
  @Column({ type: 'varchar', length: 255 })
  @IsUrl({}, { message: 'Please provide a valid main image URL' })
  @IsNotEmpty({ message: 'Property main image is required' })
  mainImageUrl: string;
  @Column({ type: 'varchar', length: 100, nullable: true })
  mainImageCloudinaryId: string;
  @Column({ type: 'simple-array', nullable: true })
  additionalImageUrls: string[];
  @Column({ type: 'simple-array', nullable: true })
  additionalImageCloudinaryIds: string[];
  @Column({ type: 'varchar', length: 200 })
  @IsNotEmpty({ message: 'Property location is required' })
  location: string;
  @Column({ type: 'varchar', length: 100 })
  @IsNotEmpty({ message: 'Property city is required' })
  city: string;
  @Column({ type: 'varchar', length: 100 })
  @IsNotEmpty({ message: 'Property region is required' })
  region: string;
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  @IsNumber({}, { message: 'Price must be a number' })
  @IsPositive({ message: 'Price must be positive' })
  price: number;
  @Column({ type: 'varchar', length: 10, default: '₵' })
  currency: string;
  @Column({ type: 'decimal', precision: 3, scale: 2, default: 0 })
  @Min(0, { message: 'Rating must be at least 0' })
  @Max(5, { message: 'Rating cannot exceed 5' })
  rating: number;
  @Column({ type: 'int', default: 0 })
  reviewCount: number;
  @Column({ type: 'enum', enum: PropertyType, default: PropertyType.HOSTEL })
  propertyType: PropertyType;
  @Column({ type: 'enum', enum: PropertyStatus, default: PropertyStatus.ACTIVE })
  status: PropertyStatus;
  @Column({ type: 'boolean', default: true })
  isFeatured: boolean;
  @Column({ type: 'boolean', default: true })
  isActive: boolean;
  @Column({ type: 'int', default: 0 })
  displayOrder: number;
  @Column({ type: 'uuid' })
  categoryId: string;
  @ManyToOne(() => Category, category => category.properties)
  @JoinColumn({ name: 'categoryId' })
  category: Category;
  @CreateDateColumn()
  createdAt: Date;
  @UpdateDateColumn()
  updatedAt: Date;
  toJSON() {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      mainImageUrl: this.mainImageUrl,
      additionalImageUrls: this.additionalImageUrls,
      location: this.location,
      city: this.city,
      region: this.region,
      price: this.price,
      currency: this.currency,
      rating: this.rating,
      reviewCount: this.reviewCount,
      propertyType: this.propertyType,
      status: this.status,
      isFeatured: this.isFeatured,
      isActive: this.isActive,
      displayOrder: this.displayOrder,
      categoryId: this.categoryId,
      category: this.category,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
} 
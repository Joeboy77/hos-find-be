import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn
} from 'typeorm';
import { IsNotEmpty, IsNumber, IsPositive, IsEnum } from 'class-validator';
import { Property } from './Property';

export enum GenderType {
  MALE = 'male',
  FEMALE = 'female',
  MIXED = 'mixed',
  ANY = 'any'
}

export enum RoomTypeCategory {
  HOSTEL = 'hostel',
  HOTEL = 'hotel',
  HOMESTAY = 'homestay',
  APARTMENT = 'apartment',
  GUESTHOUSE = 'guesthouse'
}

@Entity('room_types')
export class RoomType {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100 })
  @IsNotEmpty({ message: 'Room type name is required' })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  @IsNumber({}, { message: 'Price must be a number' })
  @IsPositive({ message: 'Price must be positive' })
  price: number;

  @Column({ type: 'varchar', length: 10, default: '₵' })
  currency: string;

  @Column({ type: 'enum', enum: GenderType, default: GenderType.ANY })
  @IsEnum(GenderType, { message: 'Invalid gender type' })
  genderType: GenderType;

  @Column({ type: 'int', default: 1 })
  capacity: number;

  @Column({ type: 'varchar', length: 50, nullable: true })
  roomTypeCategory: string;

  @Column({ type: 'boolean', default: true })
  isAvailable: boolean;

  @Column({ type: 'int', default: 0 })
  availableRooms: number;

  @Column({ type: 'int', default: 0 })
  totalRooms: number;

  @Column({ type: 'simple-array', nullable: true })
  amenities: string[];

  @Column({ type: 'varchar', length: 255, nullable: true })
  imageUrl: string;

  @Column({ type: 'simple-array', nullable: true })
  additionalImageUrls: string[];

  @Column({ type: 'uuid' })
  propertyId: string;

  @ManyToOne(() => Property, property => property.roomTypes, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'propertyId' })
  property: Property;

  @Column({ type: 'int', default: 0 })
  displayOrder: number;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      price: this.price,
      currency: this.currency,
      genderType: this.genderType,
      capacity: this.capacity,
      roomTypeCategory: this.roomTypeCategory,
      isAvailable: this.isAvailable,
      availableRooms: this.availableRooms,
      totalRooms: this.totalRooms,
      amenities: this.amenities,
      imageUrl: this.imageUrl,
      additionalImageUrls: this.additionalImageUrls,
      propertyId: this.propertyId,
      displayOrder: this.displayOrder,
      isActive: this.isActive,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
} 
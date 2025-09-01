import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany
} from 'typeorm';
import { IsNotEmpty, IsUrl } from 'class-validator';
import { Property } from './Property';

@Entity('regional_sections')
export class RegionalSection {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100 })
  @IsNotEmpty({ message: 'Section name is required' })
  name: string;

  @Column({ type: 'varchar', length: 50 })
  @IsNotEmpty({ message: 'Section type is required' })
  type: string; // popular, top_picks, featured, trending, recommended

  @Column({ type: 'varchar', length: 100 })
  @IsNotEmpty({ message: 'City/Region is required' })
  city: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'varchar', length: 255 })
  @IsUrl({}, { message: 'Please provide a valid image URL' })
  @IsNotEmpty({ message: 'Section image is required' })
  imageUrl: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  cloudinaryPublicId: string;

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

  @OneToMany(() => Property, property => property.regionalSection)
  properties: Property[];

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      type: this.type,
      city: this.city,
      description: this.description,
      imageUrl: this.imageUrl,
      propertyCount: this.propertyCount,
      isActive: this.isActive,
      displayOrder: this.displayOrder,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
}
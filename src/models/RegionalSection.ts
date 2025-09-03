import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany
} from 'typeorm';
import { IsNotEmpty } from 'class-validator';

@Entity('regional_sections')
export class RegionalSection {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100 })
  @IsNotEmpty({ message: 'Section name is required' })
  name: string;

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

  @OneToMany('Property', 'regionalSection')
  properties: any[];

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      propertyCount: this.propertyCount,
      isActive: this.isActive,
      displayOrder: this.displayOrder,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
}
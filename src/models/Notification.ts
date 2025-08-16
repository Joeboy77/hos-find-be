import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './User';

export enum NotificationType {
  NEW_PROPERTY = 'new_property',
  PROPERTY_UPDATE = 'property_update',
  SYSTEM = 'system',
  PROMOTION = 'promotion'
}

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column('text')
  message: string;

  @Column({
    type: 'enum',
    enum: NotificationType,
    default: NotificationType.SYSTEM
  })
  type: NotificationType;

  @Column({ default: false })
  isRead: boolean;

  @Column('json', { nullable: true })
  data: {
    propertyId?: string;
    propertyName?: string;
    propertyImage?: string;
    [key: string]: any;
  };

  @Column({ nullable: true })
  pushToken: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ nullable: true })
  userId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  toJSON() {
    return {
      id: this.id,
      title: this.title,
      message: this.message,
      type: this.type,
      isRead: this.isRead,
      data: this.data,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
} 
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { User } from './User';
import { Property } from './Property';
import { RoomType } from './RoomType';

export enum BookingStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  CANCELLED = 'cancelled',
  COMPLETED = 'completed',
}

@Entity('bookings')
export class Booking {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column()
  propertyId: string;

  @Column()
  roomTypeId: string;

  @Column({ type: 'date' })
  checkInDate: string;

  @Column({ type: 'date', nullable: true })
  checkOutDate: string | null;

  // guests removed - no longer tracking

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  totalAmount: number;

  @Column({ type: 'varchar', length: 3, default: 'GHS' })
  currency: string;

  @Column({
    type: 'enum',
    enum: BookingStatus,
    default: BookingStatus.PENDING,
  })
  status: BookingStatus;

  // specialRequests removed - no longer tracking

  @Column({ type: 'text', nullable: true })
  paymentReference: string;

  @Column({ type: 'boolean', default: false })
  isPaid: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => Property, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'propertyId' })
  property: Property;

  @ManyToOne(() => RoomType, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'roomTypeId' })
  roomType: RoomType;

  toJSON() {
    return {
      id: this.id,
      userId: this.userId,
      propertyId: this.propertyId,
      roomTypeId: this.roomTypeId,
      checkInDate: this.checkInDate,
      checkOutDate: this.checkOutDate,
      // guests and specialRequests removed
      totalAmount: this.totalAmount,
      currency: this.currency,
      status: this.status,
      paymentReference: this.paymentReference,
      isPaid: this.isPaid,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
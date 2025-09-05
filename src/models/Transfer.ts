import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Admin } from './Admin';

export enum TransferStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  SUCCESSFUL = 'successful',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

export enum TransferType {
  BANK_ACCOUNT = 'bank_account',
  MOBILE_MONEY = 'mobile_money',
  PAYSTACK_ACCOUNT = 'paystack_account'
}

export enum TransferRecipientType {
  USER = 'user',
  EXTERNAL = 'external'
}

@Entity('transfers')
export class Transfer {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  adminId: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({ type: 'varchar', length: 3, default: 'GHS' })
  currency: string;

  @Column({ type: 'enum', enum: TransferType })
  transferType: TransferType;

  @Column({ type: 'enum', enum: TransferRecipientType })
  recipientType: TransferRecipientType;

  @Column({ type: 'varchar', length: 255, nullable: true })
  recipientUserId: string; // If recipient is a user in the system

  @Column({ type: 'varchar', length: 255 })
  recipientName: string;

  @Column({ type: 'varchar', length: 255 })
  recipientEmail: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  recipientPhone: string;

  // Bank account details
  @Column({ type: 'varchar', length: 255, nullable: true })
  bankCode: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  bankName: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  accountNumber: string;

  // Mobile money details
  @Column({ type: 'varchar', length: 50, nullable: true })
  mobileMoneyProvider: string; // MTN, Vodafone, AirtelTigo

  @Column({ type: 'varchar', length: 20, nullable: true })
  mobileMoneyNumber: string;

  // Paystack transfer details
  @Column({ type: 'varchar', length: 255, nullable: true })
  paystackTransferCode: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  paystackReference: string;

  @Column({ type: 'enum', enum: TransferStatus, default: TransferStatus.PENDING })
  status: TransferStatus;

  @Column({ type: 'text', nullable: true })
  reason: string;

  @Column({ type: 'text', nullable: true })
  failureReason: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  transferFee: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  totalAmount: number; // amount + transferFee

  @Column({ type: 'timestamp', nullable: true })
  processedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => Admin, { eager: true })
  @JoinColumn({ name: 'adminId' })
  admin: Admin;

  toJSON() {
    return {
      id: this.id,
      adminId: this.adminId,
      amount: this.amount,
      currency: this.currency,
      transferType: this.transferType,
      recipientType: this.recipientType,
      recipientUserId: this.recipientUserId,
      recipientName: this.recipientName,
      recipientEmail: this.recipientEmail,
      recipientPhone: this.recipientPhone,
      bankCode: this.bankCode,
      bankName: this.bankName,
      accountNumber: this.accountNumber,
      mobileMoneyProvider: this.mobileMoneyProvider,
      mobileMoneyNumber: this.mobileMoneyNumber,
      paystackTransferCode: this.paystackTransferCode,
      paystackReference: this.paystackReference,
      status: this.status,
      reason: this.reason,
      failureReason: this.failureReason,
      transferFee: this.transferFee,
      totalAmount: this.totalAmount,
      processedAt: this.processedAt,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      admin: this.admin ? {
        id: this.admin.id,
        email: this.admin.email,
        fullName: this.admin.fullName,
      } : undefined,
    };
  }
}
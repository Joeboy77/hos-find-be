import { Request, Response } from 'express';
import { AppDataSource } from '../config/database';
import { Transfer, TransferStatus, TransferType, TransferRecipientType } from '../models/Transfer';
import { Admin } from '../models/Admin';
import { User } from '../models/User';
import PaystackService from '../services/paystackService';
import { validate } from 'class-validator';

const transferRepository = AppDataSource.getRepository(Transfer);
const adminRepository = AppDataSource.getRepository(Admin);
const userRepository = AppDataSource.getRepository(User);

// Get all transfers with pagination and filters
export const getAllTransfers = async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 20, status, transferType, search } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const queryBuilder = transferRepository
      .createQueryBuilder('transfer')
      .leftJoinAndSelect('transfer.admin', 'admin')
      .orderBy('transfer.createdAt', 'DESC');

    // Apply filters
    if (status) {
      queryBuilder.andWhere('transfer.status = :status', { status });
    }

    if (transferType) {
      queryBuilder.andWhere('transfer.transferType = :transferType', { transferType });
    }

    if (search) {
      queryBuilder.andWhere(
        '(transfer.recipientName ILIKE :search OR transfer.recipientEmail ILIKE :search OR transfer.recipientPhone ILIKE :search)',
        { search: `%${search}%` }
      );
    }

    const [transfers, total] = await queryBuilder
      .skip(skip)
      .take(Number(limit))
      .getManyAndCount();

    res.json({
      success: true,
      data: {
        transfers: transfers || [],
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: total || 0,
          pages: Math.ceil((total || 0) / Number(limit)),
        },
      },
    });
  } catch (error) {
    console.error('Error fetching transfers:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch transfers',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

// Get transfer statistics
export const getTransferStats = async (req: Request, res: Response) => {
  try {
    const totalTransfers = await transferRepository.count();
    const successfulTransfers = await transferRepository.count({ where: { status: TransferStatus.SUCCESSFUL } });
    const pendingTransfers = await transferRepository.count({ where: { status: TransferStatus.PENDING } });
    const failedTransfers = await transferRepository.count({ where: { status: TransferStatus.FAILED } });

    // Calculate total amounts
    const totalAmountResult = await transferRepository
      .createQueryBuilder('transfer')
      .select('SUM(transfer.amount)', 'totalAmount')
      .where('transfer.status = :status', { status: TransferStatus.SUCCESSFUL })
      .getRawOne();

    const totalFeesResult = await transferRepository
      .createQueryBuilder('transfer')
      .select('SUM(transfer.transferFee)', 'totalFees')
      .where('transfer.status = :status', { status: TransferStatus.SUCCESSFUL })
      .getRawOne();

    res.json({
      success: true,
      data: {
        totalTransfers: totalTransfers || 0,
        successfulTransfers: successfulTransfers || 0,
        pendingTransfers: pendingTransfers || 0,
        failedTransfers: failedTransfers || 0,
        totalAmount: parseFloat(totalAmountResult?.totalAmount || '0'),
        totalFees: parseFloat(totalFeesResult?.totalFees || '0'),
      },
    });
  } catch (error) {
    console.error('Error fetching transfer stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch transfer statistics',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

// Create a new transfer
export const createTransfer = async (req: Request, res: Response) => {
  try {
    const {
      amount,
      currency = 'GHS',
      transferType,
      recipientType,
      recipientUserId,
      recipientName,
      recipientEmail,
      recipientPhone,
      bankCode,
      bankName,
      accountNumber,
      mobileMoneyProvider,
      mobileMoneyNumber,
      reason,
    } = req.body;

    const adminId = (req as any).admin.id;

    // Validate required fields
    if (!amount || !transferType || !recipientName || !recipientEmail) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: amount, transferType, recipientName, recipientEmail',
      });
    }

    // Validate transfer type specific fields
    if (transferType === TransferType.BANK_ACCOUNT && (!bankCode || !accountNumber)) {
      return res.status(400).json({
        success: false,
        message: 'Bank code and account number are required for bank transfers',
      });
    }

    if (transferType === TransferType.MOBILE_MONEY && (!mobileMoneyProvider || !mobileMoneyNumber)) {
      return res.status(400).json({
        success: false,
        message: 'Mobile money provider and number are required for mobile money transfers',
      });
    }

    // Check if recipient is a user in the system
    let recipientUser = null;
    if (recipientType === TransferRecipientType.USER && recipientUserId) {
      recipientUser = await userRepository.findOne({ where: { id: recipientUserId } });
      if (!recipientUser) {
        return res.status(400).json({
          success: false,
          message: 'Recipient user not found',
        });
      }
    }

    // Calculate transfer fee (you can adjust this based on your needs)
    const transferFee = calculateTransferFee(amount, transferType);
    const totalAmount = Number(amount) + transferFee;

    // Create transfer record
    const transfer = new Transfer();
    transfer.adminId = adminId;
    transfer.amount = Number(amount);
    transfer.currency = currency;
    transfer.transferType = transferType;
    transfer.recipientType = recipientType;
    transfer.recipientUserId = recipientUserId || null;
    transfer.recipientName = recipientName;
    transfer.recipientEmail = recipientEmail;
    transfer.recipientPhone = recipientPhone || null;
    transfer.bankCode = bankCode || null;
    transfer.bankName = bankName || null;
    transfer.accountNumber = accountNumber || null;
    transfer.mobileMoneyProvider = mobileMoneyProvider || null;
    transfer.mobileMoneyNumber = mobileMoneyNumber || null;
    transfer.reason = reason || null;
    transfer.transferFee = transferFee;
    transfer.totalAmount = totalAmount;
    transfer.status = TransferStatus.PENDING;

    // Validate the transfer
    const errors = await validate(transfer);
    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.map(error => Object.values(error.constraints || {})).flat(),
      });
    }

    // Save transfer to database
    const savedTransfer = await transferRepository.save(transfer);

    // Process transfer with Paystack
    try {
      const paystackResult = await PaystackService.initiateTransfer({
        amount: totalAmount * 100, // Convert to kobo/pesewas
        currency: currency,
        recipient: recipientUserId || recipientEmail,
        reason: reason || 'Money transfer',
        source: 'balance',
        transfer_code: null, // Will be generated by Paystack
        ...(transferType === TransferType.BANK_ACCOUNT && {
          bank_code: bankCode,
          account_number: accountNumber,
        }),
        ...(transferType === TransferType.MOBILE_MONEY && {
          mobile_money: {
            provider: mobileMoneyProvider,
            phone: mobileMoneyNumber,
          },
        }),
      });

      // Update transfer with Paystack details
      savedTransfer.paystackTransferCode = paystackResult.data.transfer_code;
      savedTransfer.paystackReference = paystackResult.data.reference;
      savedTransfer.status = TransferStatus.PROCESSING;
      await transferRepository.save(savedTransfer);

      res.status(201).json({
        success: true,
        message: 'Transfer initiated successfully',
        data: savedTransfer,
      });
    } catch (paystackError) {
      // Update transfer status to failed
      savedTransfer.status = TransferStatus.FAILED;
      savedTransfer.failureReason = paystackError instanceof Error ? paystackError.message : 'Paystack error';
      await transferRepository.save(savedTransfer);

      res.status(500).json({
        success: false,
        message: 'Failed to initiate transfer with Paystack',
        error: paystackError instanceof Error ? paystackError.message : 'Unknown error',
      });
    }
  } catch (error) {
    console.error('Error creating transfer:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create transfer',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

// Get transfer by ID
export const getTransferById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const transfer = await transferRepository.findOne({
      where: { id },
      relations: ['admin'],
    });

    if (!transfer) {
      return res.status(404).json({
        success: false,
        message: 'Transfer not found',
      });
    }

    res.json({
      success: true,
      data: transfer,
    });
  } catch (error) {
    console.error('Error fetching transfer:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch transfer',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

// Cancel a transfer
export const cancelTransfer = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const transfer = await transferRepository.findOne({
      where: { id },
    });

    if (!transfer) {
      return res.status(404).json({
        success: false,
        message: 'Transfer not found',
      });
    }

    if (transfer.status !== TransferStatus.PENDING && transfer.status !== TransferStatus.PROCESSING) {
      return res.status(400).json({
        success: false,
        message: 'Only pending or processing transfers can be cancelled',
      });
    }

    // Try to cancel with Paystack if it has a transfer code
    if (transfer.paystackTransferCode) {
      try {
        await PaystackService.cancelTransfer(transfer.paystackTransferCode);
      } catch (paystackError) {
        console.error('Error cancelling transfer with Paystack:', paystackError);
        // Continue with local cancellation even if Paystack fails
      }
    }

    // Update transfer status
    transfer.status = TransferStatus.CANCELLED;
    await transferRepository.save(transfer);

    res.json({
      success: true,
      message: 'Transfer cancelled successfully',
      data: transfer,
    });
  } catch (error) {
    console.error('Error cancelling transfer:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel transfer',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

// Helper function to calculate transfer fees
function calculateTransferFee(amount: number, transferType: TransferType): number {
  // You can adjust these fees based on your business needs
  const baseFee = 5; // Base fee in GHS
  const percentageFee = 0.01; // 1% of amount

  switch (transferType) {
    case TransferType.BANK_ACCOUNT:
      return baseFee + (amount * percentageFee);
    case TransferType.MOBILE_MONEY:
      return baseFee + (amount * 0.005); // 0.5% for mobile money
    case TransferType.PAYSTACK_ACCOUNT:
      return amount * 0.005; // 0.5% for Paystack accounts
    default:
      return baseFee;
  }
}
import Paystack from 'paystack';
import dotenv from 'dotenv';

dotenv.config();

class PaystackService {
  private paystack: any;
  private isTestMode: boolean;

  constructor() {
    this.isTestMode = process.env.NODE_ENV !== 'production';
    
    const secretKey = this.isTestMode 
      ? process.env.PAYSTACK_SECRET_KEY_TEST 
      : process.env.PAYSTACK_SECRET_KEY_LIVE;

    if (!secretKey) {
      throw new Error('Paystack secret key not found in environment variables');
    }

    this.paystack = Paystack(secretKey);
  }

  /**
   * Create a transfer recipient
   */
  async createRecipient(data: {
    type: 'nuban' | 'mobile_money';
    name: string;
    account_number?: string;
    bank_code?: string;
    currency?: string;
    email?: string;
    phone?: string;
    description?: string;
  }) {
    try {
      const response = await this.paystack.transferrecipient.create(data);
      return {
        success: true,
        data: response.data,
        message: 'Recipient created successfully',
      };
    } catch (error) {
      console.error('Error creating recipient:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Initiate a transfer
   */
  async initiateTransfer(data: {
    amount: number; // Amount in kobo/pesewas
    currency: string;
    recipient: string; // recipient code or email
    reason: string;
    source: 'balance' | 'card';
    transfer_code?: string;
    bank_code?: string;
    account_number?: string;
    mobile_money?: {
      provider: string;
      phone: string;
    };
  }) {
    try {
      const response = await this.paystack.transfer.create({
        source: data.source,
        amount: data.amount,
        currency: data.currency,
        recipient: data.recipient,
        reason: data.reason,
        ...(data.transfer_code && { transfer_code: data.transfer_code }),
        ...(data.bank_code && { bank_code: data.bank_code }),
        ...(data.account_number && { account_number: data.account_number }),
        ...(data.mobile_money && { mobile_money: data.mobile_money }),
      });

      return {
        success: true,
        data: response.data,
        message: 'Transfer initiated successfully',
      };
    } catch (error) {
      console.error('Error initiating transfer:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Finalize a transfer
   */
  async finalizeTransfer(transferCode: string, otp: string) {
    try {
      const response = await this.paystack.transfer.finalize({
        transfer_code: transferCode,
        otp: otp,
      });

      return {
        success: true,
        data: response.data,
        message: 'Transfer finalized successfully',
      };
    } catch (error) {
      console.error('Error finalizing transfer:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Cancel a transfer
   */
  async cancelTransfer(transferCode: string) {
    try {
      const response = await this.paystack.transfer.cancel({
        transfer_code: transferCode,
      });

      return {
        success: true,
        data: response.data,
        message: 'Transfer cancelled successfully',
      };
    } catch (error) {
      console.error('Error cancelling transfer:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get transfer details
   */
  async getTransfer(transferCode: string) {
    try {
      const response = await this.paystack.transfer.get({
        transfer_code: transferCode,
      });

      return {
        success: true,
        data: response.data,
        message: 'Transfer retrieved successfully',
      };
    } catch (error) {
      console.error('Error getting transfer:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * List all transfers
   */
  async listTransfers(params: {
    page?: number;
    perPage?: number;
    status?: string;
    customer?: string;
    from?: string;
    to?: string;
  } = {}) {
    try {
      const response = await this.paystack.transfer.list(params);

      return {
        success: true,
        data: response.data,
        message: 'Transfers retrieved successfully',
      };
    } catch (error) {
      console.error('Error listing transfers:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get banks list
   */
  async getBanks() {
    try {
      const response = await this.paystack.misc.list_banks();

      return {
        success: true,
        data: response.data,
        message: 'Banks retrieved successfully',
      };
    } catch (error) {
      console.error('Error getting banks:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Verify bank account
   */
  async verifyBankAccount(accountNumber: string, bankCode: string) {
    try {
      const response = await this.paystack.misc.resolve_account_number({
        account_number: accountNumber,
        bank_code: bankCode,
      });

      return {
        success: true,
        data: response.data,
        message: 'Bank account verified successfully',
      };
    } catch (error) {
      console.error('Error verifying bank account:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get balance
   */
  async getBalance() {
    try {
      const response = await this.paystack.balance.get();

      return {
        success: true,
        data: response.data,
        message: 'Balance retrieved successfully',
      };
    } catch (error) {
      console.error('Error getting balance:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

export default new PaystackService();
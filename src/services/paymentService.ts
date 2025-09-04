import Paystack from 'paystack';
import dotenv from 'dotenv';

dotenv.config();

class PaymentService {
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
   * Initialize a payment transaction
   */
  async initializePayment(data: {
    email: string;
    amount: number; // Amount in kobo (smallest currency unit)
    currency?: string;
    reference?: string;
    callback_url?: string;
    metadata?: any;
  }) {
    try {
      const response = await this.paystack.transaction.initialize({
        email: data.email,
        amount: data.amount,
        currency: data.currency || 'GHS',
        reference: data.reference,
        callback_url: data.callback_url,
        metadata: data.metadata,
      });

      return {
        success: true,
        data: response.data,
        message: 'Payment initialized successfully',
      };
    } catch (error) {
      console.error('Error initializing payment:', error);
      return {
        success: false,
        message: 'Failed to initialize payment',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Verify a payment transaction
   */
  async verifyPayment(reference: string) {
    try {
      const response = await this.paystack.transaction.verify(reference);

      return {
        success: true,
        data: response.data,
        message: 'Payment verified successfully',
      };
    } catch (error) {
      console.error('Error verifying payment:', error);
      return {
        success: false,
        message: 'Failed to verify payment',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Create a customer
   */
  async createCustomer(data: {
    email: string;
    first_name?: string;
    last_name?: string;
    phone?: string;
    metadata?: any;
  }) {
    try {
      const response = await this.paystack.customer.create({
        email: data.email,
        first_name: data.first_name,
        last_name: data.last_name,
        phone: data.phone,
        metadata: data.metadata,
      });

      return {
        success: true,
        data: response.data,
        message: 'Customer created successfully',
      };
    } catch (error) {
      console.error('Error creating customer:', error);
      return {
        success: false,
        message: 'Failed to create customer',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get transaction details
   */
  async getTransaction(transactionId: string) {
    try {
      const response = await this.paystack.transaction.get(transactionId);

      return {
        success: true,
        data: response.data,
        message: 'Transaction retrieved successfully',
      };
    } catch (error) {
      console.error('Error getting transaction:', error);
      return {
        success: false,
        message: 'Failed to get transaction',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * List transactions
   */
  async listTransactions(params?: {
    perPage?: number;
    page?: number;
    customer?: string;
    status?: string;
    from?: string;
    to?: string;
  }) {
    try {
      const response = await this.paystack.transaction.list(params);

      return {
        success: true,
        data: response.data,
        message: 'Transactions retrieved successfully',
      };
    } catch (error) {
      console.error('Error listing transactions:', error);
      return {
        success: false,
        message: 'Failed to list transactions',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get public key for client-side initialization
   */
  getPublicKey(): string {
    return this.isTestMode 
      ? process.env.PAYSTACK_PUBLIC_KEY_TEST || ''
      : process.env.PAYSTACK_PUBLIC_KEY_LIVE || '';
  }

  /**
   * Check if in test mode
   */
  isInTestMode(): boolean {
    return this.isTestMode;
  }
}

export default new PaymentService();
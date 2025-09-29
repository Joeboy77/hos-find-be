import Mailjet from 'node-mailjet';

export interface EmailVerificationData {
  email: string;
  fullName: string;
  verificationCode: string;
}

class EmailService {
  private mailjet: Mailjet;
  private fromEmail: string;
  private fromName: string;

  constructor() {
    const apiKey = process.env.MAILJET_API_KEY;
    const secretKey = process.env.MAILJET_SECRET_KEY;
    const fromEmail = process.env.MAILJET_FROM_EMAIL || 'noreply@hosfind.com';
    const fromName = process.env.MAILJET_FROM_NAME || 'HosFind';

    if (!apiKey || !secretKey) {
      throw new Error('MAILJET_API_KEY and MAILJET_SECRET_KEY are required');
    }

    this.mailjet = new Mailjet({
      apiKey: apiKey,
      apiSecret: secretKey,
    });

    this.fromEmail = fromEmail;
    this.fromName = fromName;
  }

  async sendVerificationEmail(data: EmailVerificationData): Promise<boolean> {
    try {
      console.log('📧 [EMAIL] Sending verification email to:', data.email);

      const request = this.mailjet.post('send', { version: 'v3.1' }).request({
        Messages: [
          {
            From: {
              Email: this.fromEmail,
              Name: this.fromName,
            },
            To: [
              {
                Email: data.email,
                Name: data.fullName,
              },
            ],
            Subject: 'Verify Your HosFind Account',
            TextPart: this.getVerificationEmailText(data),
            HTMLPart: this.getVerificationEmailTemplate(data),
          },
        ],
      });

      const response = await request;

      console.log('✅ [EMAIL] Verification email sent successfully:', response.body);
      return true;
    } catch (error) {
      console.error('❌ [EMAIL] Failed to send verification email:', error);
      return false;
    }
  }

  private getVerificationEmailTemplate(data: EmailVerificationData): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Verify Your HosFind Account</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
              background-color: #f8f9fa;
            }
            .container {
              background-color: #ffffff;
              border-radius: 12px;
              padding: 40px;
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
            }
            .logo {
              font-size: 28px;
              font-weight: bold;
              color: #e74c3c;
              margin-bottom: 10px;
            }
            .title {
              font-size: 24px;
              font-weight: bold;
              color: #2c3e50;
              margin-bottom: 20px;
            }
            .verification-code {
              background-color: #f8f9fa;
              border: 2px solid #e74c3c;
              border-radius: 8px;
              padding: 20px;
              text-align: center;
              margin: 30px 0;
            }
            .code {
              font-size: 32px;
              font-weight: bold;
              color: #e74c3c;
              letter-spacing: 8px;
              font-family: 'Courier New', monospace;
            }
            .instructions {
              background-color: #e8f4fd;
              border-left: 4px solid #3498db;
              padding: 15px;
              margin: 20px 0;
              border-radius: 4px;
            }
            .footer {
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #eee;
              text-align: center;
              color: #666;
              font-size: 14px;
            }
            .button {
              display: inline-block;
              background-color: #e74c3c;
              color: white;
              padding: 12px 24px;
              text-decoration: none;
              border-radius: 6px;
              font-weight: bold;
              margin: 20px 0;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">🏨 HosFind</div>
              <h1 class="title">Verify Your Account</h1>
            </div>
            
            <p>Hello <strong>${data.fullName}</strong>,</p>
            
            <p>Welcome to HosFind! To complete your account setup, please verify your email address using the verification code below:</p>
            
            <div class="verification-code">
              <div class="code">${data.verificationCode}</div>
            </div>
            
            <div class="instructions">
              <strong>Instructions:</strong>
              <ul>
                <li>Enter this 4-digit code in the HosFind app</li>
                <li>The code will expire in 10 minutes</li>
                <li>If you didn't create an account, please ignore this email</li>
              </ul>
            </div>
            
            <p>If you have any questions or need assistance, please don't hesitate to contact our support team.</p>
            
            <div class="footer">
              <p>Best regards,<br>The HosFind Team</p>
              <p>This is an automated message. Please do not reply to this email.</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  private getVerificationEmailText(data: EmailVerificationData): string {
    return `
      HosFind - Verify Your Account
      
      Hello ${data.fullName},
      
      Welcome to HosFind! To complete your account setup, please verify your email address using the verification code below:
      
      Verification Code: ${data.verificationCode}
      
      Instructions:
      - Enter this 4-digit code in the HosFind app
      - The code will expire in 10 minutes
      - If you didn't create an account, please ignore this email
      
      If you have any questions or need assistance, please don't hesitate to contact our support team.
      
      Best regards,
      The HosFind Team
      
      This is an automated message. Please do not reply to this email.
    `;
  }
}

export default new EmailService();
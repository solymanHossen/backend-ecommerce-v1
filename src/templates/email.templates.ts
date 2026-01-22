export const verifyEmailTemplate = (name: string, otp: string, otpExpirationMinutes: number) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #333; text-align: center;">Email Verification</h2>
      <p>Hello <strong>${name}</strong>,</p>
      <p>Thank you for registering! Please use the following OTP to verify your email address:</p>
      <div style="background-color: #f8f9fa; border: 2px solid #007bff; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;">
        <h1 style="color: #007bff; font-size: 32px; letter-spacing: 8px; margin: 0;">${otp}</h1>
      </div>
      <p><strong>This OTP will expire in ${otpExpirationMinutes} minutes.</strong></p>
      <p>If you didn't create an account, please ignore this email.</p>
      <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
      <p style="color: #666; font-size: 14px; text-align: center;">
        This is an automated message, please do not reply to this email.
      </p>
    </div>
  `;

export const resetPasswordTemplate = (url: string) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #333; text-align: center;">Password Reset</h2>
        <p>You are receiving this because you (or someone else) have requested the reset of the password for your account.</p>
        <p>Please click on the following link, or paste this into your browser to complete the process:</p>
        <div style="text-align: center; margin: 20px 0;">
            <a href="${url}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Reset Password</a>
        </div>
        <p>If you did not request this, please ignore this email and your password will remain unchanged.</p>
    </div>
`;

import { User, IUser } from "../models/user.model";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import crypto from "crypto";
import bcrypt from "bcryptjs";

const OTP_EXPIRATION_MINUTES = 10;

export class AuthService {
  // Generate a cryptographically secure 6-digit OTP
  private static generateOTP(): string {
    return crypto.randomInt(100000, 1000000).toString();
  }

  // Hash OTP before storing in DB
  private static async hashOTP(otp: string): Promise<string> {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(otp, salt);
  }

  // Send OTP via email
  private static async sendVerificationEmail(
    email: string,
    name: string,
    otp: string
  ): Promise<void> {
    // Log OTP for development purposes
    console.log(`[DEV] OTP for ${email}: ${otp}`);

    try {
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });

      await transporter.sendMail({
        from: `"E-Commerce App" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: "Verify your account - OTP Code",
        html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #333; text-align: center;">Email Verification</h2>
          <p>Hello <strong>${name}</strong>,</p>
          <p>Thank you for registering! Please use the following OTP to verify your email address:</p>
          <div style="background-color: #f8f9fa; border: 2px solid #007bff; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;">
            <h1 style="color: #007bff; font-size: 32px; letter-spacing: 8px; margin: 0;">${otp}</h1>
          </div>
          <p><strong>This OTP will expire in ${OTP_EXPIRATION_MINUTES} minutes.</strong></p>
          <p>If you didn't create an account, please ignore this email.</p>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
          <p style="color: #666; font-size: 14px; text-align: center;">
            This is an automated message, please do not reply to this email.
          </p>
        </div>
      `,
      });
    } catch (error) {
      console.error("Failed to send verification email:", error);
      console.log(`[DEV] Email sending failed. Use this OTP to verify: ${otp}`);
    }
  }

  static async register(
    name: string,
    email: string,
    password: string
  ): Promise<IUser> {
    try {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        throw new Error("User with this email already exists");
      }

      // Generate OTP
      const plainOTP = this.generateOTP();
      const hashedOTP = await this.hashOTP(plainOTP);

      const user = new User({
        name,
        email,
        password, // This will be hashed by the pre-save hook
        verificationOTP: hashedOTP,
        otpExpires: new Date(Date.now() + OTP_EXPIRATION_MINUTES * 60 * 1000),
      });

      await user.save();

      // Send OTP email
      await this.sendVerificationEmail(email, name, plainOTP);

      return user;
    } catch (error: any) {
      console.error("Registration error:", error);
      throw new Error(error.message || "Failed to register user");
    }
  }

  // Verify OTP
  static async verifyOTP(email: string, otp: string): Promise<IUser> {
    try {
      const user = await User.findOne({ email });

      if (!user) {
        throw new Error("User not found");
      }

      if (!user.verificationOTP || !user.otpExpires) {
        throw new Error("No OTP found. Please request a new verification code.");
      }

      if (user.otpExpires < new Date()) {
        // Clean up expired OTP
        user.verificationOTP = undefined;
        user.otpExpires = undefined;
        await user.save();
        throw new Error("OTP has expired. Please request a new one.");
      }

      const isMatch = await bcrypt.compare(otp, user.verificationOTP);
      if (!isMatch) {
        throw new Error("Invalid OTP. Please check your code and try again.");
      }

      // Verify user and clean up OTP fields
      user.isVerified = true;
      user.verificationOTP = undefined;
      user.otpExpires = undefined;
      await user.save();

      return user;
    } catch (error: any) {
      console.error("OTP verification error:", error);
      throw new Error(error.message || "Failed to verify OTP");
    }
  }

  // Resend OTP
  static async resendOTP(email: string): Promise<void> {
    try {
      const user = await User.findOne({ email });

      if (!user) {
        throw new Error("User not found");
      }

      if (user.isVerified) {
        throw new Error("Email is already verified");
      }

      // Generate new OTP
      const plainOTP = this.generateOTP();
      const hashedOTP = await this.hashOTP(plainOTP);

      user.verificationOTP = hashedOTP;
      user.otpExpires = new Date(Date.now() + OTP_EXPIRATION_MINUTES * 60 * 1000);
      await user.save();

      // Send new OTP email
      await this.sendVerificationEmail(email, user.name, plainOTP);
    } catch (error: any) {
      console.error("Resend OTP error:", error);
      throw new Error(error.message || "Failed to resend OTP");
    }
  }

  static async login(
    email: string,
    password: string
  ): Promise<{ user: IUser; token: string; refreshToken: string }> {
    const user = await User.findOne({ email });
    if (!user) {
      throw new Error("User not found");
    }
    if (!user.isVerified) {
      throw new Error("Email not verified. Please check your inbox.");
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      throw new Error("Invalid credentials");
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET!, {
      expiresIn: "1000m",
    });
    const refreshToken = jwt.sign(
      { id: user._id },
      process.env.JWT_REFRESH_SECRET!,
      {
        expiresIn: "7d",
      }
    );
    user.refreshToken = refreshToken;
    await user.save();

    return { user, token, refreshToken };
  }

  static async refreshAccessToken(refreshToken: string): Promise<{ token: string }> {
    const user = await User.findOne({ refreshToken });
    if (!user) {
      throw new Error("Invalid refresh token");
    }
    try {
      jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET!);
    } catch (err) {
      throw new Error("Refresh token expired or invalid");
    }
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET!, {
      expiresIn: "10m",
    });
    return { token };
  }

  static async forgotPassword(email: string): Promise<void> {
    const user = await User.findOne({ email });
    if (!user) {
      throw new Error("User not found");
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = new Date(Date.now() + 3600000); // 1 hour from now
    await user.save();

    console.log(`[DEV] Reset Token for ${email}: ${resetToken}`);

    try {
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });

      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: "Password Reset",
        text: `You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n
        Please click on the following link, or paste this into your browser to complete the process:\n\n
        ${process.env.BASE_URL}/reset-password/${resetToken}\n\n
        If you did not request this, please ignore this email and your password will remain unchanged.\n`,
      };

      await transporter.sendMail(mailOptions);
    } catch (error) {
      console.error("Failed to send password reset email:", error);
      console.log(`[DEV] Password reset link: ${process.env.BASE_URL}/reset-password/${resetToken}`);
    }
  }

  static async resetPassword(
    token: string,
    newPassword: string
  ): Promise<void> {
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      throw new Error("Password reset token is invalid or has expired");
    }

    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();
  }
}

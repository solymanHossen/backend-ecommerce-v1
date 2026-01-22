import { User, IUser } from "../models/user.model";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { verifyEmailTemplate, resetPasswordTemplate } from "../templates/email.templates";
import { AppError } from "../utils/AppError";

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
        html: verifyEmailTemplate(name, otp, OTP_EXPIRATION_MINUTES),
      });
    } catch (error) {
       // Log failure but ensure NO sensitive data like OTP is logged
       // Rethrow to let controller handle it
       throw new AppError("Failed to send verification email", 500);
    }
  }

  static async register(
    name: string,
    email: string,
    password: string
  ): Promise<IUser> {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
    throw new AppError("User with this email already exists", 400);
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
  }

  // Verify OTP
  static async verifyOTP(email: string, otp: string): Promise<IUser> {
      const user = await User.findOne({ email });

      if (!user) {
        throw new AppError("User not found", 404);
      }

      if (user.isVerified) {
          throw new AppError("User is already verified", 400);
      }

      if (!user.verificationOTP || !user.otpExpires) {
        throw new AppError("No OTP found. Please request a new verification code.", 400);
      }

      if (user.otpExpires < new Date()) {
        // Clean up expired OTP
        user.verificationOTP = undefined;
        user.otpExpires = undefined;
        await user.save();
        throw new AppError("OTP has expired. Please request a new one.", 400);
      }

      const isMatch = await bcrypt.compare(otp, user.verificationOTP);
      if (!isMatch) {
        throw new AppError("Invalid OTP. Please check your code and try again.", 400);
      }

      // Verify user and clean up OTP fields
      user.isVerified = true;
      user.verificationOTP = undefined;
      user.otpExpires = undefined;
      await user.save();

      return user;
  }

  // Resend OTP
  static async resendOTP(email: string): Promise<void> {
      const user = await User.findOne({ email });

      if (!user) {
        throw new AppError("User not found", 404);
      }

      if (user.isVerified) {
        throw new AppError("Email is already verified", 400);
      }

      // Generate new OTP
      const plainOTP = this.generateOTP();
      const hashedOTP = await this.hashOTP(plainOTP);

      user.verificationOTP = hashedOTP;
      user.otpExpires = new Date(Date.now() + OTP_EXPIRATION_MINUTES * 60 * 1000);
      await user.save();

      // Send new OTP email
      await this.sendVerificationEmail(email, user.name, plainOTP);
  }

  static async login(
    email: string,
    password: string
  ): Promise<{ user: IUser; token: string; refreshToken: string }> {
    const user = await User.findOne({ email });
    if (!user) {
      throw new AppError("User not found", 404);
    }
    if (!user.isVerified) {
      throw new AppError("Email not verified. Please check your inbox.", 400);
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      throw new AppError("Invalid credentials", 401);
    }

    // Include role in payload
    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET!, {
      expiresIn: "1000m", // Increased for development ease, adjust for prod
    });
    const refreshToken = jwt.sign(
      { id: user._id, role: user.role },
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
      throw new AppError("Invalid refresh token", 401);
    }
    try {
      jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET!);
    } catch (err) {
      throw new AppError("Refresh token expired or invalid", 401);
    }
    // Include role in payload
    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET!, {
      expiresIn: "10m",
    });
    return { token };
  }

  static async logout(userId: string): Promise<void> {
    const user = await User.findById(userId);
    if (!user) {
      throw new AppError("User not found", 404);
    }
    user.refreshToken = undefined;
    await user.save();
  }

  static async forgotPassword(email: string): Promise<void> {
    const user = await User.findOne({ email });
    if (!user) {
      throw new AppError("User not found", 404);
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 mins
    await user.save();

    // Send email
    try {
      const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
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
        subject: "Password Reset Request",
        html: resetPasswordTemplate(resetUrl),
      });
    } catch (error) {
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;
      await user.save();
      throw new AppError("Failed to send reset email", 500);
    }
  }

  static async resetPassword(token: string, newPassword: string): Promise<void> {
    const hashedToken = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      throw new AppError("Invalid or expired reset token", 400);
    }

    user.password = newPassword; // Will be hashed by pre-save
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();
  }
}

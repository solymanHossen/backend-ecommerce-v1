import { Request, Response } from "express";
import { AuthService } from "../services/auth.service";
import sendResponse from "../utils/response";
import { asyncHandler } from "../utils/asyncHandler";
import { AuthRequest } from "../middleware/auth.middleware";

export const register = asyncHandler(async (req: Request, res: Response) => {
    const { name, email, password } = req.body;
    await AuthService.register(name, email, password);
    sendResponse(res, 201, true, "User registered successfully. Please check your email for OTP verification.");
});

export const verifyEmail = asyncHandler(async (req: Request, res: Response) => {
    const { otp, email } = req.body;
    await AuthService.verifyOTP(email, otp);
    sendResponse(res, 200, true, "Email verified successfully. You can now login.");
});

export const resendVerificationOTP = asyncHandler(async (req: Request, res: Response) => {
    const { email } = req.body;
    await AuthService.resendOTP(email);
    sendResponse(res, 200, true, "New OTP sent to your email successfully.");
});

export const login = asyncHandler(async (req: Request, res: Response) => {
    const { email, password } = req.body;
    const { user, token, refreshToken } = await AuthService.login(email, password);
    sendResponse(res, 200, true, "Login successful!", {
        token,
        refreshToken,
        user: {
            email: user.email,
            name: user.name,
            role: user.role,
            isVerified: user.isVerified,
        },
    });
});

export const refreshToken = asyncHandler(async (req: Request, res: Response) => {
    const { refreshToken } = req.body;
    const { token } = await AuthService.refreshAccessToken(refreshToken);
    sendResponse(res, 200, true, "Token refreshed", { token });
});

export const forgotPassword = asyncHandler(async (req: Request, res: Response) => {
    const { email } = req.body;
    await AuthService.forgotPassword(email);
    sendResponse(res, 200, true, "Password reset email sent");
});

export const resetPassword = asyncHandler(async (req: Request, res: Response) => {
    const { token } = req.params;
    const { password } = req.body;
    await AuthService.resetPassword(token, password);
    sendResponse(res, 200, true, "Password has been reset");
});

export const logout = asyncHandler(async (req: AuthRequest, res: Response) => {
   if (req.user) {
       await AuthService.logout(req.user._id);
   }
   // Return 204 No Content as per requirement
   res.status(204).send();
});

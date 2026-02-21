import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import User from '../models/User';
import { AuthenticatedRequest } from '../middlewares/auth';
import {
  generateAccessToken,
  generateRefreshToken,
  generateSecureToken,
  hashToken,
  verifyRefreshToken,
  TokenPayload,
} from '../utils/tokenUtils';
import {
  sendVerificationEmail,
  sendPasswordResetEmail,
} from '../services/emailService';

/**
 * Register a new user
 * POST /api/auth/register
 *
 * Sends a verification email (dev mode: logged to console).
 * The user cannot access protected endpoints until verified.
 */
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array(),
      });
      return;
    }

    const { name, email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      res.status(400).json({
        success: false,
        message: 'Email already registered.',
      });
      return;
    }

    // Hash password
    const password_hash = await User.hashPassword(password);

    // Generate email verification token
    const rawToken = generateSecureToken();
    const hashedToken = hashToken(rawToken);

    // Create user (unverified)
    const user = await User.create({
      name,
      email,
      password_hash,
      type: 'regular',
      email_verified: false,
      email_verification_token: hashedToken,
    });

    // Send verification email (dev mode: logged to console)
    await sendVerificationEmail(email, name, rawToken);

    res.status(201).json({
      success: true,
      message:
        'User registered successfully. Please check your email to verify your account.',
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          type: user.type,
          email_verified: user.email_verified,
        },
      },
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      success: false,
      message: 'Error registering user.',
    });
  }
};

/**
 * Verify email address
 * GET /api/auth/verify-email?token=<token>
 */
export const verifyEmail = async (req: Request, res: Response): Promise<void> => {
  try {
    const { token } = req.query;

    if (!token || typeof token !== 'string') {
      res.status(400).json({
        success: false,
        message: 'Verification token is required.',
      });
      return;
    }

    const hashedToken = hashToken(token);

    const user = await User.findOne({
      where: { email_verification_token: hashedToken },
    });

    if (!user) {
      res.status(400).json({
        success: false,
        message: 'Invalid or expired verification token.',
      });
      return;
    }

    if (user.email_verified) {
      res.status(200).json({
        success: true,
        message: 'Email is already verified.',
      });
      return;
    }

    // Mark as verified and clear token
    await user.update({
      email_verified: true,
      email_verification_token: null,
    });

    res.status(200).json({
      success: true,
      message: 'Email verified successfully. You can now log in.',
    });
  } catch (error) {
    console.error('Verify email error:', error);
    res.status(500).json({
      success: false,
      message: 'Error verifying email.',
    });
  }
};

/**
 * Resend verification email
 * POST /api/auth/resend-verification
 */
export const resendVerification = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;

    if (!email) {
      res.status(400).json({
        success: false,
        message: 'Email is required.',
      });
      return;
    }

    const user = await User.findOne({ where: { email } });

    // Always return success to avoid user enumeration
    if (!user || user.email_verified) {
      res.status(200).json({
        success: true,
        message: 'If the email exists and is unverified, a verification email has been sent.',
      });
      return;
    }

    // Generate new verification token
    const rawToken = generateSecureToken();
    const hashedToken = hashToken(rawToken);

    await user.update({ email_verification_token: hashedToken });

    await sendVerificationEmail(user.email, user.name, rawToken);

    res.status(200).json({
      success: true,
      message: 'If the email exists and is unverified, a verification email has been sent.',
    });
  } catch (error) {
    console.error('Resend verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Error resending verification email.',
    });
  }
};

/**
 * Login user
 * POST /api/auth/login
 *
 * Returns access token (15 min) and refresh token (7 days).
 * Rejects unverified users.
 */
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array(),
      });
      return;
    }

    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ where: { email } });
    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
      return;
    }

    // Check password
    const isValidPassword = await user.comparePassword(password);
    if (!isValidPassword) {
      res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
      return;
    }

    // Reject unverified users
    if (!user.email_verified) {
      res.status(403).json({
        success: false,
        message: 'Please verify your email address before logging in.',
        code: 'EMAIL_NOT_VERIFIED',
      });
      return;
    }

    // Generate token pair
    const payload: TokenPayload = { id: user.id, email: user.email, type: user.type };
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    // Update last login timestamp
    await user.update({ last_login: new Date() });

    res.status(200).json({
      success: true,
      message: 'Login successful.',
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          type: user.type,
          avatar_url: user.avatar_url,
          bio: user.bio,
          email_verified: user.email_verified,
        },
        token: accessToken,
        accessToken,
        refreshToken,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Error logging in.',
    });
  }
};

/**
 * Refresh access token using a valid refresh token
 * POST /api/auth/refresh-token
 */
export const refreshToken = async (req: Request, res: Response): Promise<void> => {
  try {
    const { refreshToken: token } = req.body;

    if (!token) {
      res.status(400).json({
        success: false,
        message: 'Refresh token is required.',
      });
      return;
    }

    // Verify refresh token
    let decoded: TokenPayload;
    try {
      decoded = verifyRefreshToken(token);
    } catch {
      res.status(401).json({
        success: false,
        message: 'Invalid or expired refresh token.',
      });
      return;
    }

    // Check user still exists
    const user = await User.findByPk(decoded.id);
    if (!user) {
      res.status(401).json({
        success: false,
        message: 'User no longer exists.',
      });
      return;
    }

    // Issue new token pair
    const payload: TokenPayload = { id: user.id, email: user.email, type: user.type };
    const newAccessToken = generateAccessToken(payload);
    const newRefreshToken = generateRefreshToken(payload);

    res.status(200).json({
      success: true,
      message: 'Token refreshed.',
      data: {
        token: newAccessToken,
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      },
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(500).json({
      success: false,
      message: 'Error refreshing token.',
    });
  }
};

/**
 * Logout user (client-side token removal)
 * POST /api/auth/logout
 */
export const logout = async (_req: Request, res: Response): Promise<void> => {
  // JWT is stateless, so logout is handled on client side.
  // This endpoint exists for consistency and future token blacklist support.
  res.status(200).json({
    success: true,
    message: 'Logout successful. Please remove the token from client storage.',
  });
};

/**
 * Get current user profile
 * GET /api/auth/me
 */
export const getMe = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const user = await User.findByPk(req.user?.id, {
      attributes: { exclude: ['password_hash', 'email_verification_token', 'password_reset_token', 'password_reset_expires'] },
    });

    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found.',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: { user },
    });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user profile.',
    });
  }
};

/**
 * Forgot password - send reset email
 * POST /api/auth/forgot-password
 */
export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;

    if (!email) {
      res.status(400).json({
        success: false,
        message: 'Email is required.',
      });
      return;
    }

    const user = await User.findOne({ where: { email } });

    // Always return success to prevent user enumeration
    if (!user) {
      res.status(200).json({
        success: true,
        message: 'If the email is registered, a password reset link has been sent.',
      });
      return;
    }

    // Generate reset token (expires in 1 hour)
    const rawToken = generateSecureToken();
    const hashedToken = hashToken(rawToken);
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await user.update({
      password_reset_token: hashedToken,
      password_reset_expires: expires,
    });

    // Send reset email
    await sendPasswordResetEmail(user.email, user.name, rawToken);

    res.status(200).json({
      success: true,
      message: 'If the email is registered, a password reset link has been sent.',
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing password reset request.',
    });
  }
};

/**
 * Reset password with token
 * POST /api/auth/reset-password
 */
export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array(),
      });
      return;
    }

    const { token, password } = req.body;

    if (!token) {
      res.status(400).json({
        success: false,
        message: 'Reset token is required.',
      });
      return;
    }

    const hashedToken = hashToken(token);

    const user = await User.findOne({
      where: { password_reset_token: hashedToken },
    });

    if (!user) {
      res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token.',
      });
      return;
    }

    // Check expiration
    if (user.isResetTokenExpired()) {
      // Clear the expired token
      await user.update({
        password_reset_token: null,
        password_reset_expires: null,
      });

      res.status(400).json({
        success: false,
        message: 'Reset token has expired. Please request a new one.',
      });
      return;
    }

    // Hash new password and clear reset token
    const password_hash = await User.hashPassword(password);
    await user.update({
      password_hash,
      password_reset_token: null,
      password_reset_expires: null,
    });

    res.status(200).json({
      success: true,
      message: 'Password reset successfully. You can now log in with your new password.',
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Error resetting password.',
    });
  }
};

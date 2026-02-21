/**
 * Auth Controller Tests
 *
 * Unit tests for the full authentication flow:
 * - Registration with email verification
 * - Email verification
 * - Login (verified / unverified)
 * - Token refresh
 * - Password reset flow
 * - Protected route middleware
 */

import { Request, Response } from 'express';

// ─── Mocks ──────────────────────────────────────────────────────────────────

// Mock User model
const mockUserInstance = {
  id: 1,
  name: 'Test User',
  email: 'test@example.com',
  password_hash: 'hashed_password',
  type: 'regular' as const,
  email_verified: false,
  email_verification_token: null as string | null,
  password_reset_token: null as string | null,
  password_reset_expires: null as Date | null,
  last_login: null as Date | null,
  avatar_url: undefined,
  bio: undefined,
  comparePassword: jest.fn(),
  isResetTokenExpired: jest.fn(),
  update: jest.fn(),
};

jest.mock('../models/User', () => {
  const mock = {
    findOne: jest.fn(),
    findByPk: jest.fn(),
    create: jest.fn(),
    hashPassword: jest.fn(),
  };
  return { __esModule: true, default: mock };
});

jest.mock('../services/emailService', () => ({
  sendVerificationEmail: jest.fn().mockResolvedValue(undefined),
  sendPasswordResetEmail: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('../utils/tokenUtils', () => ({
  generateSecureToken: jest.fn().mockReturnValue('raw_token_hex'),
  hashToken: jest.fn().mockReturnValue('hashed_token_hex'),
  generateAccessToken: jest.fn().mockReturnValue('access.jwt.token'),
  generateRefreshToken: jest.fn().mockReturnValue('refresh.jwt.token'),
  verifyRefreshToken: jest.fn(),
  verifyAccessToken: jest.fn(),
}));

jest.mock('express-validator', () => ({
  validationResult: jest.fn().mockReturnValue({ isEmpty: () => true, array: () => [] }),
}));

// ─── Imports (after mocks) ──────────────────────────────────────────────────

import User from '../models/User';
import {
  register,
  verifyEmail,
  resendVerification,
  login,
  refreshToken,
  logout,
  getMe,
  forgotPassword,
  resetPassword,
} from '../controllers/authController';
import { sendVerificationEmail, sendPasswordResetEmail } from '../services/emailService';
import {
  generateSecureToken,
  hashToken,
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from '../utils/tokenUtils';
import { validationResult } from 'express-validator';

// ─── Helpers ────────────────────────────────────────────────────────────────

function mockReq(overrides: Record<string, any> = {}): Request {
  return {
    body: {},
    query: {},
    params: {},
    headers: {},
    ...overrides,
  } as unknown as Request;
}

function mockRes(): Response {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res as Response;
}

function freshUser(overrides: Record<string, any> = {}) {
  return {
    ...mockUserInstance,
    comparePassword: jest.fn(),
    isResetTokenExpired: jest.fn(),
    update: jest.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

// ─── Tests ──────────────────────────────────────────────────────────────────

beforeEach(() => {
  jest.clearAllMocks();
});

// ═══════════════════════════════════════════════════════════════════════════
// REGISTER
// ═══════════════════════════════════════════════════════════════════════════

describe('register', () => {
  it('should register a new user and send verification email', async () => {
    (User.findOne as jest.Mock).mockResolvedValue(null);
    (User.hashPassword as jest.Mock).mockResolvedValue('hashed_pw');
    (User.create as jest.Mock).mockResolvedValue(freshUser({ email_verified: false }));

    const req = mockReq({ body: { name: 'Test', email: 'test@example.com', password: 'Password1!' } });
    const res = mockRes();

    await register(req, res);

    expect(User.create).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'test@example.com',
        email_verified: false,
        email_verification_token: 'hashed_token_hex',
      })
    );
    expect(sendVerificationEmail).toHaveBeenCalledWith('test@example.com', 'Test', 'raw_token_hex');
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it('should reject duplicate email', async () => {
    (User.findOne as jest.Mock).mockResolvedValue(freshUser());
    const req = mockReq({ body: { name: 'Test', email: 'test@example.com', password: 'Password1!' } });
    const res = mockRes();

    await register(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Email already registered.' })
    );
  });

  it('should return 400 on validation errors', async () => {
    (validationResult as unknown as jest.Mock).mockReturnValueOnce({
      isEmpty: () => false,
      array: () => [{ msg: 'Invalid email' }],
    });

    const req = mockReq({ body: { name: '', email: 'bad', password: '1' } });
    const res = mockRes();

    await register(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Validation failed' })
    );
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// VERIFY EMAIL
// ═══════════════════════════════════════════════════════════════════════════

describe('verifyEmail', () => {
  it('should verify a valid token', async () => {
    const user = freshUser({ email_verified: false });
    (User.findOne as jest.Mock).mockResolvedValue(user);

    const req = mockReq({ query: { token: 'raw_token_hex' } });
    const res = mockRes();

    await verifyEmail(req, res);

    expect(hashToken).toHaveBeenCalledWith('raw_token_hex');
    expect(user.update).toHaveBeenCalledWith({ email_verified: true, email_verification_token: null });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Email verified successfully. You can now log in.' })
    );
  });

  it('should return 400 if token is missing', async () => {
    const req = mockReq({ query: {} });
    const res = mockRes();

    await verifyEmail(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('should return 400 for invalid token', async () => {
    (User.findOne as jest.Mock).mockResolvedValue(null);

    const req = mockReq({ query: { token: 'invalid_token' } });
    const res = mockRes();

    await verifyEmail(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Invalid or expired verification token.' })
    );
  });

  it('should handle already-verified user gracefully', async () => {
    const user = freshUser({ email_verified: true });
    (User.findOne as jest.Mock).mockResolvedValue(user);

    const req = mockReq({ query: { token: 'raw_token_hex' } });
    const res = mockRes();

    await verifyEmail(req, res);

    expect(user.update).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Email is already verified.' })
    );
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// RESEND VERIFICATION
// ═══════════════════════════════════════════════════════════════════════════

describe('resendVerification', () => {
  it('should resend verification for unverified user', async () => {
    const user = freshUser({ email_verified: false });
    (User.findOne as jest.Mock).mockResolvedValue(user);

    const req = mockReq({ body: { email: 'test@example.com' } });
    const res = mockRes();

    await resendVerification(req, res);

    expect(user.update).toHaveBeenCalledWith({ email_verification_token: 'hashed_token_hex' });
    expect(sendVerificationEmail).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('should not reveal if email does not exist (anti-enumeration)', async () => {
    (User.findOne as jest.Mock).mockResolvedValue(null);

    const req = mockReq({ body: { email: 'ghost@test.com' } });
    const res = mockRes();

    await resendVerification(req, res);

    expect(sendVerificationEmail).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  it('should not resend for already-verified user', async () => {
    (User.findOne as jest.Mock).mockResolvedValue(freshUser({ email_verified: true }));

    const req = mockReq({ body: { email: 'test@example.com' } });
    const res = mockRes();

    await resendVerification(req, res);

    expect(sendVerificationEmail).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// LOGIN
// ═══════════════════════════════════════════════════════════════════════════

describe('login', () => {
  it('should return tokens for verified user with correct credentials', async () => {
    const user = freshUser({ email_verified: true });
    user.comparePassword.mockResolvedValue(true);
    (User.findOne as jest.Mock).mockResolvedValue(user);

    const req = mockReq({ body: { email: 'test@example.com', password: 'Password1!' } });
    const res = mockRes();

    await login(req, res);

    expect(generateAccessToken).toHaveBeenCalled();
    expect(generateRefreshToken).toHaveBeenCalled();
    expect(user.update).toHaveBeenCalledWith({ last_login: expect.any(Date) });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          accessToken: 'access.jwt.token',
          refreshToken: 'refresh.jwt.token',
        }),
      })
    );
  });

  it('should reject unverified user with 403 EMAIL_NOT_VERIFIED', async () => {
    const user = freshUser({ email_verified: false });
    user.comparePassword.mockResolvedValue(true);
    (User.findOne as jest.Mock).mockResolvedValue(user);

    const req = mockReq({ body: { email: 'test@example.com', password: 'Password1!' } });
    const res = mockRes();

    await login(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ code: 'EMAIL_NOT_VERIFIED' })
    );
  });

  it('should return 401 for wrong password', async () => {
    const user = freshUser({ email_verified: true });
    user.comparePassword.mockResolvedValue(false);
    (User.findOne as jest.Mock).mockResolvedValue(user);

    const req = mockReq({ body: { email: 'test@example.com', password: 'wrong' } });
    const res = mockRes();

    await login(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Invalid email or password.' })
    );
  });

  it('should return 401 for non-existent email', async () => {
    (User.findOne as jest.Mock).mockResolvedValue(null);

    const req = mockReq({ body: { email: 'no@user.com', password: 'Password1!' } });
    const res = mockRes();

    await login(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// REFRESH TOKEN
// ═══════════════════════════════════════════════════════════════════════════

describe('refreshToken', () => {
  it('should issue new token pair for valid refresh token', async () => {
    (verifyRefreshToken as jest.Mock).mockReturnValue({ id: 1, email: 'test@example.com', type: 'regular' });
    (User.findByPk as jest.Mock).mockResolvedValue(freshUser({ email_verified: true }));

    const req = mockReq({ body: { refreshToken: 'valid.refresh.token' } });
    const res = mockRes();

    await refreshToken(req, res);

    expect(generateAccessToken).toHaveBeenCalled();
    expect(generateRefreshToken).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          accessToken: 'access.jwt.token',
          refreshToken: 'refresh.jwt.token',
        }),
      })
    );
  });

  it('should return 401 for invalid refresh token', async () => {
    (verifyRefreshToken as jest.Mock).mockImplementation(() => {
      throw new Error('invalid');
    });

    const req = mockReq({ body: { refreshToken: 'bad.token' } });
    const res = mockRes();

    await refreshToken(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('should return 400 if refresh token not provided', async () => {
    const req = mockReq({ body: {} });
    const res = mockRes();

    await refreshToken(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// LOGOUT
// ═══════════════════════════════════════════════════════════════════════════

describe('logout', () => {
  it('should return success message', async () => {
    const req = mockReq();
    const res = mockRes();

    await logout(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// GET ME
// ═══════════════════════════════════════════════════════════════════════════

describe('getMe', () => {
  it('should return user profile without sensitive fields', async () => {
    (User.findByPk as jest.Mock).mockResolvedValue(freshUser({ email_verified: true }));

    const req = mockReq({ user: { id: 1, email: 'test@example.com', type: 'regular' } });
    const res = mockRes();

    await getMe(req as any, res);

    expect(User.findByPk).toHaveBeenCalledWith(1, {
      attributes: {
        exclude: ['password_hash', 'email_verification_token', 'password_reset_token', 'password_reset_expires'],
      },
    });
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('should return 404 if user not found', async () => {
    (User.findByPk as jest.Mock).mockResolvedValue(null);

    const req = mockReq({ user: { id: 999, email: 'gone@test.com', type: 'regular' } });
    const res = mockRes();

    await getMe(req as any, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// FORGOT PASSWORD
// ═══════════════════════════════════════════════════════════════════════════

describe('forgotPassword', () => {
  it('should generate reset token and send email for existing user', async () => {
    const user = freshUser();
    (User.findOne as jest.Mock).mockResolvedValue(user);

    const req = mockReq({ body: { email: 'test@example.com' } });
    const res = mockRes();

    await forgotPassword(req, res);

    expect(user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        password_reset_token: 'hashed_token_hex',
        password_reset_expires: expect.any(Date),
      })
    );
    expect(sendPasswordResetEmail).toHaveBeenCalledWith('test@example.com', 'Test User', 'raw_token_hex');
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('should not reveal if email does not exist (anti-enumeration)', async () => {
    (User.findOne as jest.Mock).mockResolvedValue(null);

    const req = mockReq({ body: { email: 'ghost@test.com' } });
    const res = mockRes();

    await forgotPassword(req, res);

    expect(sendPasswordResetEmail).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  it('should return 400 if email not provided', async () => {
    const req = mockReq({ body: {} });
    const res = mockRes();

    await forgotPassword(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// RESET PASSWORD
// ═══════════════════════════════════════════════════════════════════════════

describe('resetPassword', () => {
  it('should reset password with valid token', async () => {
    const user = freshUser();
    user.isResetTokenExpired.mockReturnValue(false);
    (User.findOne as jest.Mock).mockResolvedValue(user);
    (User.hashPassword as jest.Mock).mockResolvedValue('new_hashed_pw');

    const req = mockReq({ body: { token: 'raw_token_hex', password: 'NewPassword1!' } });
    const res = mockRes();

    await resetPassword(req, res);

    expect(user.update).toHaveBeenCalledWith({
      password_hash: 'new_hashed_pw',
      password_reset_token: null,
      password_reset_expires: null,
    });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Password reset successfully. You can now log in with your new password.' })
    );
  });

  it('should return 400 for expired token', async () => {
    const user = freshUser();
    user.isResetTokenExpired.mockReturnValue(true);
    (User.findOne as jest.Mock).mockResolvedValue(user);

    const req = mockReq({ body: { token: 'raw_token_hex', password: 'NewPassword1!' } });
    const res = mockRes();

    await resetPassword(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Reset token has expired. Please request a new one.' })
    );
  });

  it('should return 400 for invalid token', async () => {
    (User.findOne as jest.Mock).mockResolvedValue(null);

    const req = mockReq({ body: { token: 'invalid', password: 'NewPassword1!' } });
    const res = mockRes();

    await resetPassword(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Invalid or expired reset token.' })
    );
  });

  it('should return 400 if token not provided', async () => {
    const req = mockReq({ body: { password: 'NewPassword1!' } });
    const res = mockRes();

    await resetPassword(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// TOKEN UTILS (direct unit tests)
// ═══════════════════════════════════════════════════════════════════════════

describe('tokenUtils', () => {
  // Unmock tokenUtils for direct unit testing
  beforeAll(() => {
    jest.unmock('../utils/tokenUtils');
  });

  it('generateSecureToken returns hex string of expected length', () => {
    const { generateSecureToken } = jest.requireActual('../utils/tokenUtils');
    const token = generateSecureToken(32);
    expect(token).toHaveLength(64); // 32 bytes = 64 hex chars
    expect(/^[a-f0-9]+$/.test(token)).toBe(true);
  });

  it('hashToken returns deterministic SHA-256 hex', () => {
    const { hashToken } = jest.requireActual('../utils/tokenUtils');
    const hash1 = hashToken('test');
    const hash2 = hashToken('test');
    expect(hash1).toBe(hash2);
    expect(hash1).toHaveLength(64);
  });

  it('hashToken returns different output for different input', () => {
    const { hashToken } = jest.requireActual('../utils/tokenUtils');
    const hash1 = hashToken('token_a');
    const hash2 = hashToken('token_b');
    expect(hash1).not.toBe(hash2);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// MIDDLEWARE (authenticate, requireVerified, authorizeRoles)
// ═══════════════════════════════════════════════════════════════════════════

describe('auth middleware', () => {
  // We test the middleware logic directly

  it('authenticate should reject requests without Authorization header', async () => {
    const { authenticate } = jest.requireActual('../middlewares/auth');
    const req = mockReq({ headers: {} });
    const res = mockRes();
    const next = jest.fn();

    await authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('authenticate should reject malformed Bearer token', async () => {
    const { authenticate } = jest.requireActual('../middlewares/auth');
    const req = mockReq({ headers: { authorization: 'NotBearer xyz' } });
    const res = mockRes();
    const next = jest.fn();

    await authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('requireVerified should reject if no user on request', async () => {
    const { requireVerified } = jest.requireActual('../middlewares/auth');
    const req = mockReq({});
    const res = mockRes();
    const next = jest.fn();

    await requireVerified(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('authorizeRoles should reject user without allowed role', async () => {
    const { authorizeRoles } = jest.requireActual('../middlewares/auth');
    const middleware = authorizeRoles('admin');
    const req = mockReq({ user: { id: 1, email: 'test@example.com', type: 'regular' } });
    const res = mockRes();
    const next = jest.fn();

    middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it('authorizeRoles should allow user with matching role', async () => {
    const { authorizeRoles } = jest.requireActual('../middlewares/auth');
    const middleware = authorizeRoles('admin', 'regular');
    const req = mockReq({ user: { id: 1, email: 'test@example.com', type: 'regular' } });
    const res = mockRes();
    const next = jest.fn();

    middleware(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });
});

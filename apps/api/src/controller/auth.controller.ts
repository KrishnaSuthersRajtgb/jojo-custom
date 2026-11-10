import type { Request, Response } from 'express';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { fromNodeHeaders } from 'better-auth/node';
import { User, type IUser } from '../model/index.js';
import { generateReferralCode } from './referral.controller.js';
import { emailService, type OtpPurpose } from '../services/email.service.js';
import { getAuth, isGoogleOAuthConfigured } from '../lib/auth.js';

const JWT_SECRET = process.env['JWT_SECRET'] ?? 'jojo-flora-super-secret-jwt-key';
const MAX_LOGIN_ATTEMPTS = 5;
const LOCK_DURATION_MS = 30 * 60 * 1000; // 30 minutes
const unknownEmailAttempts = new Map<string, { attempts: number; lockUntil?: number }>();

function generate6DigitOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function signUserToken(user: IUser): string {
  return jwt.sign(
    {
      id: user._id.toString(),
      username: user.username,
      email: user.email,
      role: user.role,
    },
    JWT_SECRET,
    { expiresIn: '7d' },
  );
}

function formatSafeUser(user: IUser) {
  return {
    username: user.username,
    email: user.email,
    gender: user.gender || 'Not specified',
    phoneNumber: user.phoneNumber || '',
    role: user.role,
    emailVerified: user.emailVerified,
    authProvider: user.authProvider,
    avatarUrl: user.avatarUrl,
    referralCode: user.referralCode,
    referredBy: user.referredBy,
    referralCount: user.referralCount,
    loyaltyCredits: user.loyaltyCredits,
  };
}

async function findAuthenticatedUser(req: Request): Promise<IUser | null> {
  const id = req.user?.id;
  if (id && mongoose.Types.ObjectId.isValid(id)) {
    const byId = await User.findById(id);
    if (byId) return byId;
  }

  const orConditions: Record<string, string>[] = [];
  if (req.user?.email) {
    orConditions.push({ email: req.user.email.toLowerCase() });
  }
  const xEmail = (req.headers['x-email'] as string | undefined)?.trim().toLowerCase();
  if (xEmail) {
    orConditions.push({ email: xEmail });
  }
  if (req.user?.username) {
    orConditions.push({ username: req.user.username });
  }
  const xUsername = (req.headers['x-username'] as string | undefined)?.trim();
  if (xUsername) {
    orConditions.push({ username: xUsername });
    orConditions.push({ email: xUsername.toLowerCase() });
  }

  if (orConditions.length === 0) return null;
  return User.findOne({ $or: orConditions });
}

export class AuthController {
  /**
   * Public capability status for Google OAuth & SMTP Email
   * GET /api/auth/status
   */
  getAuthStatus(_req: Request, res: Response): void {
    res.status(200).json({
      data: {
        googleEnabled: isGoogleOAuthConfigured(),
        smtpConfigured: emailService.isSmtpConfigured(),
      },
    });
  }

  /**
   * Register a new user & send 6-digit Email OTP.
   * POST /api/auth/register or /api/auth/signup
   */
  async register(req: Request, res: Response): Promise<void> {
    try {
      const { username, email, gender, phoneNumber, password, referralCode } = req.body as {
        username?: string;
        email?: string;
        gender?: string;
        phoneNumber?: string;
        password?: string;
        referralCode?: string;
      };

      if (!username || !email || !gender || !phoneNumber || !password) {
        res.status(400).json({ error: 'All fields are required.' });
        return;
      }

      const normalizedEmail = email.trim().toLowerCase();
      const cleanUsername = username.trim();

      // Check for existing user
      const existingUser = await User.findOne({
        $or: [{ email: normalizedEmail }, { username: cleanUsername }],
      });

      const otp = generate6DigitOtp();
      const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

      if (existingUser) {
        if (existingUser.email.toLowerCase() === normalizedEmail) {
          // If account exists but was never email-verified, refresh OTP and allow verification
          if (!existingUser.emailVerified) {
            const salt = await bcrypt.genSalt(10);
            existingUser.password = await bcrypt.hash(password, salt);
            existingUser.username = cleanUsername;
            existingUser.gender = gender;
            existingUser.phoneNumber = phoneNumber;
            existingUser.otpCode = otp;
            existingUser.otpExpiresAt = otpExpiresAt;
            await existingUser.save();

            const emailResult = await emailService.sendOtpEmail(
              normalizedEmail,
              otp,
              'email-verification',
            );

            res.status(200).json({
              data: {
                requiresOtp: true,
                email: existingUser.email,
                emailSent: emailResult.sent,
                devOtp: emailResult.previewOtp,
                message: emailResult.sent
                  ? 'Verification OTP resent to your email address.'
                  : 'OTP generated. Check email/server log to verify.',
              },
            });
            return;
          }

          res.status(409).json({ error: 'An account with this email already exists.' });
          return;
        }
        res.status(409).json({ error: 'This username is already taken.' });
        return;
      }

      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      // Auto-generate unique referral code
      let myCode = generateReferralCode(cleanUsername);
      while (await User.findOne({ referralCode: myCode })) {
        myCode = generateReferralCode(cleanUsername);
      }

      let referredBy: string | undefined = undefined;
      if (referralCode && typeof referralCode === 'string' && referralCode.trim()) {
        const cleanRef = referralCode.trim().toUpperCase();
        const referrer = await User.findOne({ referralCode: cleanRef });
        if (referrer && referrer.username !== cleanUsername) {
          referredBy = referrer.username;
          referrer.referralCount = (referrer.referralCount || 0) + 1;
          await referrer.save();
        }
      }

      // Create user with pending email verification OTP
      const newUserData: {
        username: string;
        email: string;
        gender: string;
        phoneNumber: string;
        password: string;
        emailVerified: boolean;
        otpCode: string;
        otpExpiresAt: Date;
        authProvider: 'local';
        referralCode: string;
        referredBy?: string;
        referralCount: number;
        loyaltyCredits: number;
      } = {
        username: cleanUsername,
        email: normalizedEmail,
        gender,
        phoneNumber,
        password: hashedPassword,
        emailVerified: false,
        otpCode: otp,
        otpExpiresAt,
        authProvider: 'local',
        referralCode: myCode,
        referralCount: 0,
        loyaltyCredits: 0,
      };
      if (referredBy) {
        newUserData.referredBy = referredBy;
      }

      const user = await User.create(newUserData);

      // Send 6-digit OTP to user's email
      const emailResult = await emailService.sendOtpEmail(user.email, otp, 'email-verification');

      res.status(201).json({
        data: {
          requiresOtp: true,
          email: user.email,
          emailSent: emailResult.sent,
          devOtp: emailResult.previewOtp,
          message: emailResult.sent
            ? `A 6-digit verification OTP has been sent to ${user.email}.`
            : `OTP generated for ${user.email}. Enter the code below to verify.`,
        },
      });
    } catch (error) {
      console.error('[auth] Register error:', error);
      res.status(500).json({ error: 'Failed to create account.' });
    }
  }

  /**
   * Verify 6-digit Email OTP after Signup.
   * POST /api/auth/verify-otp
   */
  async verifyOtp(req: Request, res: Response): Promise<void> {
    try {
      const { email, otp } = req.body as { email?: string; otp?: string };
      if (!email || !otp) {
        res.status(400).json({ error: 'Email and 6-digit OTP code are required.' });
        return;
      }

      const user = await User.findOne({ email: email.trim().toLowerCase() });
      if (!user) {
        res.status(404).json({ error: 'No account found with this email.' });
        return;
      }

      if (!user.otpCode || user.otpCode !== otp.trim()) {
        res.status(400).json({ error: 'Invalid verification OTP code.' });
        return;
      }

      if (user.otpExpiresAt && user.otpExpiresAt.getTime() < Date.now()) {
        res.status(400).json({ error: 'OTP has expired. Please request a new code.' });
        return;
      }

      user.emailVerified = true;
      user.otpCode = undefined;
      user.otpExpiresAt = undefined;
      await user.save();

      const token = signUserToken(user);
      res.setHeader('x-fresh-token', token);

      res.status(200).json({
        data: {
          token,
          user: formatSafeUser(user),
          message: 'Email verified successfully.',
        },
      });
    } catch (error) {
      console.error('[auth] verifyOtp error:', error);
      res.status(500).json({ error: 'Failed to verify OTP.' });
    }
  }

  /**
   * Resend 6-digit Email OTP.
   * POST /api/auth/resend-otp
   */
  async resendOtp(req: Request, res: Response): Promise<void> {
    try {
      const { email, type } = req.body as { email?: string; type?: OtpPurpose };
      if (!email) {
        res.status(400).json({ error: 'Email is required.' });
        return;
      }

      const user = await User.findOne({ email: email.trim().toLowerCase() });
      if (!user) {
        res.status(404).json({ error: 'No account found with this email.' });
        return;
      }

      const otp = generate6DigitOtp();
      user.otpCode = otp;
      user.otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
      await user.save();

      const purpose: OtpPurpose =
        type === 'forget-password' ? 'forget-password' : 'email-verification';
      const emailResult = await emailService.sendOtpEmail(user.email, otp, purpose);

      res.status(200).json({
        data: {
          emailSent: emailResult.sent,
          devOtp: emailResult.previewOtp,
          message: emailResult.sent
            ? `Verification code sent to ${user.email}.`
            : `New OTP generated for ${user.email}.`,
        },
      });
    } catch (error) {
      console.error('[auth] resendOtp error:', error);
      res.status(500).json({ error: 'Failed to resend OTP.' });
    }
  }

  /**
   * Request Password Reset Email OTP.
   * POST /api/auth/forgot-password
   */
  async forgotPassword(req: Request, res: Response): Promise<void> {
    try {
      const { email } = req.body as { email?: string };
      if (!email || !email.trim()) {
        res.status(400).json({ error: 'Please enter your registered email address.' });
        return;
      }

      const normalizedEmail = email.trim().toLowerCase();
      const user = await User.findOne({ email: normalizedEmail });
      if (!user) {
        res.status(404).json({ error: 'No account found matching that email address.' });
        return;
      }

      const otp = generate6DigitOtp();
      user.otpCode = otp;
      user.otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
      await user.save();

      const emailResult = await emailService.sendOtpEmail(user.email, otp, 'forget-password');

      res.status(200).json({
        data: {
          email: user.email,
          emailSent: emailResult.sent,
          devOtp: emailResult.previewOtp,
          message: emailResult.sent
            ? `A 6-digit password reset OTP has been sent to ${user.email}.`
            : `Password reset OTP generated for ${user.email}.`,
        },
      });
    } catch (error) {
      console.error('[auth] forgotPassword error:', error);
      res.status(500).json({ error: 'Failed to initiate password reset.' });
    }
  }

  /**
   * Reset Password with Email OTP.
   * POST /api/auth/reset-password
   */
  async resetPassword(req: Request, res: Response): Promise<void> {
    try {
      const { email, otp, newPassword } = req.body as {
        email?: string;
        otp?: string;
        newPassword?: string;
      };

      if (!email || !otp || !newPassword) {
        res.status(400).json({ error: 'Email, OTP code, and new password are required.' });
        return;
      }

      if (newPassword.length < 6) {
        res.status(400).json({ error: 'New password must be at least 6 characters.' });
        return;
      }

      const user = await User.findOne({ email: email.trim().toLowerCase() });
      if (!user) {
        res.status(404).json({ error: 'Account not found.' });
        return;
      }

      if (!user.otpCode || user.otpCode !== otp.trim()) {
        res.status(400).json({ error: 'Invalid verification OTP code.' });
        return;
      }

      if (user.otpExpiresAt && user.otpExpiresAt.getTime() < Date.now()) {
        res.status(400).json({ error: 'OTP has expired. Please request a new reset code.' });
        return;
      }

      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(newPassword, salt);
      user.emailVerified = true;
      user.otpCode = undefined;
      user.otpExpiresAt = undefined;
      await user.save();

      res.status(200).json({
        data: {
          message: 'Password reset successfully. You can now sign in with your new password.',
        },
      });
    } catch (error) {
      console.error('[auth] resetPassword error:', error);
      res.status(500).json({ error: 'Failed to reset password.' });
    }
  }

  /**
   * Authenticated Change Password from Profile.
   * PUT /api/auth/change-password
   */
  async changePassword(req: Request, res: Response): Promise<void> {
    try {
      const { currentPassword, newPassword } = req.body as {
        currentPassword?: string;
        newPassword?: string;
      };

      if (!newPassword || newPassword.length < 6) {
        res.status(400).json({ error: 'New password must be at least 6 characters long.' });
        return;
      }

      const user = await findAuthenticatedUser(req);
      if (!user) {
        res.status(404).json({ error: 'User account not found.' });
        return;
      }

      // If user already has a local password, require verification of currentPassword
      if (user.password) {
        if (!currentPassword) {
          res.status(400).json({ error: 'Current password is required.' });
          return;
        }
        const isValid = await bcrypt.compare(currentPassword, user.password);
        if (!isValid) {
          res.status(401).json({ error: 'Current password is incorrect.' });
          return;
        }
      }

      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(newPassword, salt);
      await user.save();

      res.status(200).json({
        data: {
          message: 'Password updated successfully.',
        },
      });
    } catch (error) {
      console.error('[auth] changePassword error:', error);
      res.status(500).json({ error: 'Failed to update password.' });
    }
  }

  /**
   * Bridge BetterAuth session (Google OAuth) into app User & JWT.
   * GET /api/auth/better-session
   */
  async getBetterSession(req: Request, res: Response): Promise<void> {
    try {
      const betterAuth = getAuth();
      const session = await betterAuth.api.getSession({
        headers: fromNodeHeaders(req.headers),
      });

      if (!session?.user.email) {
        res.status(401).json({ error: 'No active Google / BetterAuth session found.' });
        return;
      }

      const normalizedEmail = session.user.email.trim().toLowerCase();
      let user = await User.findOne({ email: normalizedEmail });

      if (!user) {
        const baseName = (session.user.name || normalizedEmail.split('@')[0] || 'Patron').trim();
        let candidateUsername = baseName;
        let suffix = 1;
        while (await User.findOne({ username: candidateUsername })) {
          candidateUsername = `${baseName} ${String(suffix++)}`;
        }

        let myCode = generateReferralCode(candidateUsername);
        while (await User.findOne({ referralCode: myCode })) {
          myCode = generateReferralCode(candidateUsername);
        }

        user = await User.create({
          username: candidateUsername,
          email: normalizedEmail,
          gender: 'Not specified',
          phoneNumber: '',
          emailVerified: true,
          authProvider: 'google',
          avatarUrl: session.user.image ?? undefined,
          referralCode: myCode,
          referralCount: 0,
          loyaltyCredits: 0,
        });
      } else if (!user.emailVerified || (!user.avatarUrl && session.user.image)) {
        user.emailVerified = true;
        if (!user.avatarUrl && session.user.image) {
          user.avatarUrl = session.user.image;
        }
        await user.save();
      }

      const token = signUserToken(user);
      res.setHeader('x-fresh-token', token);

      res.status(200).json({
        data: {
          token,
          user: formatSafeUser(user),
        },
      });
    } catch (error) {
      console.error('[auth] getBetterSession error:', error);
      res.status(500).json({ error: 'Failed to sync Google authentication session.' });
    }
  }

  /**
   * Login user.
   * POST /api/auth/login
   */
  async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body as {
        email?: string;
        password?: string;
      };

      if (!email || !password) {
        res.status(400).json({ error: 'Email and password are required.' });
        return;
      }

      const normalizedIdentifier = email.trim().toLowerCase();

      // Find user by email or username
      const user = await User.findOne({
        $or: [{ email: normalizedIdentifier }, { username: email.trim() }],
      });

      if (!user) {
        const entry = unknownEmailAttempts.get(normalizedIdentifier) ?? { attempts: 0 };
        if (entry.lockUntil && entry.lockUntil > Date.now()) {
          const minsLeft = Math.max(1, Math.ceil((entry.lockUntil - Date.now()) / 60000));
          res.status(429).json({
            error: `Account is locked after ${String(MAX_LOGIN_ATTEMPTS)} failed login attempts. Please try again after ${String(minsLeft)} minute${minsLeft === 1 ? '' : 's'}.`,
          });
          return;
        }
        if (entry.lockUntil && entry.lockUntil <= Date.now()) {
          entry.attempts = 0;
          delete entry.lockUntil;
        }
        entry.attempts += 1;
        if (entry.attempts >= MAX_LOGIN_ATTEMPTS) {
          entry.lockUntil = Date.now() + LOCK_DURATION_MS;
          unknownEmailAttempts.set(normalizedIdentifier, entry);
          res.status(429).json({
            error: `Maximum ${String(MAX_LOGIN_ATTEMPTS)} failed login attempts reached. Please try again after 30 minutes.`,
          });
          return;
        }
        unknownEmailAttempts.set(normalizedIdentifier, entry);
        const remaining = MAX_LOGIN_ATTEMPTS - entry.attempts;
        res.status(401).json({
          error: `Invalid email or password. ${String(remaining)} attempt${remaining === 1 ? '' : 's'} remaining before 30-minute lockout.`,
        });
        return;
      }

      // Check if account is currently locked (blocks 6th+ attempt for 30 minutes)
      if (user.lockUntil && user.lockUntil.getTime() > Date.now()) {
        const minsLeft = Math.max(1, Math.ceil((user.lockUntil.getTime() - Date.now()) / 60000));
        res.status(429).json({
          error: `Account is locked after ${String(MAX_LOGIN_ATTEMPTS)} failed login attempts. You can try again after ${String(minsLeft)} minute${minsLeft === 1 ? '' : 's'}.`,
        });
        return;
      }

      // Lock duration expired — reset counter automatically
      if (user.lockUntil && user.lockUntil.getTime() <= Date.now()) {
        user.failedLoginAttempts = 0;
        user.lockUntil = undefined;
      }

      if (!user.password) {
        res.status(401).json({
          error:
            'This account uses Google Sign-In. Please click "Continue with Google" or use Forgot Password to set a password.',
        });
        return;
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;

        if (user.failedLoginAttempts >= MAX_LOGIN_ATTEMPTS) {
          user.lockUntil = new Date(Date.now() + LOCK_DURATION_MS);
          await user.save();
          res.status(429).json({
            error: `Maximum ${String(MAX_LOGIN_ATTEMPTS)} failed login attempts reached. Your account is locked for 30 minutes. Please try again after 30 minutes.`,
          });
          return;
        }

        await user.save();
        const remaining = MAX_LOGIN_ATTEMPTS - user.failedLoginAttempts;
        res.status(401).json({
          error: `Invalid email or password. ${String(remaining)} attempt${remaining === 1 ? '' : 's'} remaining before 30-minute lockout.`,
        });
        return;
      }

      // Reset failed attempt counters on successful login
      let needsSave = false;
      if (user.failedLoginAttempts > 0 || user.lockUntil) {
        user.failedLoginAttempts = 0;
        user.lockUntil = undefined;
        needsSave = true;
      }

      if (!user.referralCode) {
        let code = generateReferralCode(user.username);
        while (await User.findOne({ referralCode: code })) {
          code = generateReferralCode(user.username);
        }
        user.referralCode = code;
        needsSave = true;
      }

      if (needsSave) {
        await user.save();
      }

      const token = signUserToken(user);
      res.setHeader('x-fresh-token', token);

      res.status(200).json({
        data: {
          token,
          user: formatSafeUser(user),
        },
      });
    } catch (error) {
      console.error('[auth] Login error:', error);
      res.status(500).json({ error: 'Login failed.' });
    }
  }

  /**
   * Get current user profile.
   * GET /api/auth/me or /api/auth/profile
   */
  async getProfile(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized.' });
        return;
      }

      const user = await findAuthenticatedUser(req);
      if (!user) {
        res.status(404).json({ error: 'User not found.' });
        return;
      }

      res.status(200).json({ data: formatSafeUser(user) });
    } catch (error) {
      console.error('[auth] Get profile error:', error);
      res.status(500).json({ error: 'Failed to fetch profile.' });
    }
  }

  /**
   * Update profile.
   * PUT /api/auth/profile
   */
  async updateProfile(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized.' });
        return;
      }

      const { username, email, gender, phoneNumber } = req.body as {
        username?: string;
        email?: string;
        gender?: string;
        phoneNumber?: string;
      };

      let user = await findAuthenticatedUser(req);

      // If still not found (e.g. session created in offline mode), upsert gracefully using verified session email/username
      if (!user) {
        const targetEmail = (
          email ||
          req.user.email ||
          (req.headers['x-email'] as string | undefined)
        )
          ?.trim()
          .toLowerCase();
        const targetUsername = (username || req.user.username).trim();

        if (!targetEmail || !targetUsername) {
          res.status(404).json({ error: 'User not found.' });
          return;
        }

        let myCode = generateReferralCode(targetUsername);
        while (await User.findOne({ referralCode: myCode })) {
          myCode = generateReferralCode(targetUsername);
        }

        user = await User.create({
          username: targetUsername,
          email: targetEmail,
          gender: gender?.trim() || 'Not specified',
          phoneNumber: phoneNumber?.trim() || '',
          emailVerified: true,
          authProvider: 'local',
          referralCode: myCode,
          referralCount: 0,
          loyaltyCredits: 0,
        });
      } else {
        // Check conflicts against OTHER users
        const nextUsername = username?.trim();
        const nextEmail = email?.trim().toLowerCase();

        if (nextUsername && nextUsername !== user.username) {
          const usernameTaken = await User.findOne({
            username: nextUsername,
            _id: { $ne: user._id },
          });
          if (usernameTaken) {
            res.status(409).json({ error: 'This username is already taken.' });
            return;
          }
          user.username = nextUsername;
        }

        if (nextEmail && nextEmail !== user.email) {
          const emailTaken = await User.findOne({
            email: nextEmail,
            _id: { $ne: user._id },
          });
          if (emailTaken) {
            res.status(409).json({ error: 'An account with this email already exists.' });
            return;
          }
          user.email = nextEmail;
        }

        if (gender !== undefined) user.gender = gender.trim() || 'Not specified';
        if (phoneNumber !== undefined) user.phoneNumber = phoneNumber.trim();

        await user.save();
      }

      // Mint a fresh token containing any updated username/email so future requests never fail with stale claims
      const freshToken = signUserToken(user);
      res.setHeader('x-fresh-token', freshToken);

      res.status(200).json({
        data: {
          ...formatSafeUser(user),
          token: freshToken,
        },
      });
    } catch (error) {
      console.error('[auth] Update profile error:', error);
      res.status(500).json({ error: 'Failed to update profile.' });
    }
  }

  /**
   * Admin: Get all registered users.
   * GET /api/auth/users
   */
  async getAllUsers(_req: Request, res: Response): Promise<void> {
    try {
      const users = await User.find({})
        .select('-password -otpCode -otpExpiresAt')
        .sort({ createdAt: -1 });
      res.status(200).json({ data: users });
    } catch (error) {
      console.error('[auth] Get all users error:', error);
      res.status(500).json({ error: 'Failed to fetch registered users.' });
    }
  }

  /**
   * Admin: Delete user.
   * DELETE /api/auth/users/:id
   */
  async deleteUser(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const deleted = await User.findByIdAndDelete(id);
      if (!deleted) {
        res.status(404).json({ error: 'User not found.' });
        return;
      }
      res.status(200).json({ message: 'User deleted successfully.' });
    } catch (error) {
      console.error('[auth] Delete user error:', error);
      res.status(500).json({ error: 'Failed to delete user.' });
    }
  }

  /**
   * Admin: Assign or update role by email or user ID.
   * PATCH /api/auth/role
   */
  async updateRole(req: Request, res: Response): Promise<void> {
    try {
      const { email, role, userId } = req.body as {
        email?: string;
        role?: 'user' | 'staff' | 'admin';
        userId?: string;
      };

      if (!role || !['user', 'staff', 'admin'].includes(role)) {
        res.status(400).json({ error: 'Valid role (admin, staff, or user) is required.' });
        return;
      }

      if (!email && !userId) {
        res.status(400).json({ error: 'Email ID or user ID is required.' });
        return;
      }

      let user = null;
      if (userId) {
        user = await User.findById(userId);
      } else if (email) {
        user = await User.findOne({ email: email.trim().toLowerCase() });
      }

      if (!user) {
        res
          .status(404)
          .json({ error: `User with identifier "${email ?? userId ?? ''}" not found.` });
        return;
      }

      user.role = role;
      await user.save();

      res.status(200).json({
        data: {
          _id: user._id,
          username: user.username,
          email: user.email,
          role: user.role,
        },
        message: `Role for ${user.email} updated to "${role}" successfully.`,
      });
    } catch (error) {
      console.error('[auth] Update role error:', error);
      res.status(500).json({ error: 'Failed to update user role.' });
    }
  }

  /**
   * Admin: Add note to user profile.
   * POST /api/auth/users/:id/notes
   */
  async addAdminNote(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { note } = req.body as { note?: string };

      if (!note || !note.trim()) {
        res.status(400).json({ error: 'Note text is required.' });
        return;
      }

      const user = await User.findById(id);
      if (!user) {
        res.status(404).json({ error: 'User not found.' });
        return;
      }

      if (!user.adminNotes) {
        user.adminNotes = [];
      }

      user.adminNotes.unshift({
        note: note.trim(),
        addedAt: new Date(),
      });

      await user.save();

      res.status(200).json({
        data: user,
        message: 'Admin note added successfully.',
      });
    } catch (error) {
      console.error('[auth] Add admin note error:', error);
      res.status(500).json({ error: 'Failed to add admin note.' });
    }
  }

  /**
   * Admin: Update customer flag (VIP, Needs Attention, Blocked, none).
   * PATCH /api/auth/users/:id/flag
   */
  async updateCustomerFlag(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { flag } = req.body as { flag?: 'none' | 'VIP' | 'Needs Attention' | 'Blocked' };

      const validFlags = ['none', 'VIP', 'Needs Attention', 'Blocked'];
      if (!flag || !validFlags.includes(flag)) {
        res.status(400).json({ error: `Valid flag (${validFlags.join(', ')}) is required.` });
        return;
      }

      const user = await User.findById(id);
      if (!user) {
        res.status(404).json({ error: 'User not found.' });
        return;
      }

      user.flag = flag;
      await user.save();

      res.status(200).json({
        data: user,
        message: `Customer flag updated to "${flag}".`,
      });
    } catch (error) {
      console.error('[auth] Update customer flag error:', error);
      res.status(500).json({ error: 'Failed to update customer flag.' });
    }
  }
}

export const authController = new AuthController();

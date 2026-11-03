import type { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../model/index.js';
import { generateReferralCode } from './referral.controller.js';

const JWT_SECRET = process.env['JWT_SECRET'] ?? 'jojo-flora-super-secret-jwt-key';

export class AuthController {
  /**
   * Register a new user.
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

      // Check for existing user
      const existingUser = await User.findOne({
        $or: [{ email: email.toLowerCase() }, { username }],
      });

      if (existingUser) {
        if (existingUser.email.toLowerCase() === email.toLowerCase()) {
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
      let myCode = generateReferralCode(username);
      while (await User.findOne({ referralCode: myCode })) {
        myCode = generateReferralCode(username);
      }

      let referredBy: string | undefined = undefined;
      if (referralCode && typeof referralCode === 'string' && referralCode.trim()) {
        const cleanRef = referralCode.trim().toUpperCase();
        const referrer = await User.findOne({ referralCode: cleanRef });
        if (referrer && referrer.username !== username) {
          referredBy = referrer.username;
          referrer.referralCount = (referrer.referralCount || 0) + 1;
          await referrer.save();
        }
      }

      // Create user
      const newUserData: {
        username: string;
        email: string;
        gender: string;
        phoneNumber: string;
        password: string;
        referralCode: string;
        referredBy?: string;
        referralCount: number;
        loyaltyCredits: number;
      } = {
        username,
        email: email.toLowerCase(),
        gender,
        phoneNumber,
        password: hashedPassword,
        referralCode: myCode,
        referralCount: 0,
        loyaltyCredits: 0,
      };
      if (referredBy) {
        newUserData.referredBy = referredBy;
      }

      const user = await User.create(newUserData);

      // Generate token
      const token = jwt.sign(
        { id: user._id.toString(), username: user.username, email: user.email, role: user.role },
        JWT_SECRET,
        { expiresIn: '7d' },
      );

      res.status(201).json({
        data: {
          token,
          user: {
            username: user.username,
            email: user.email,
            gender: user.gender,
            phoneNumber: user.phoneNumber,
            role: user.role,
            referralCode: user.referralCode,
            referralCount: user.referralCount,
            loyaltyCredits: user.loyaltyCredits,
          },
        },
      });
    } catch (error) {
      console.error('[auth] Register error:', error);
      res.status(500).json({ error: 'Failed to create account.' });
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

      // Find user by email or username
      const user = await User.findOne({
        $or: [{ email: email.toLowerCase() }, { username: email }],
      });

      if (!user || !user.password) {
        res.status(401).json({ error: 'Invalid email or password.' });
        return;
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        res.status(401).json({ error: 'Invalid email or password.' });
        return;
      }

      if (!user.referralCode) {
        let code = generateReferralCode(user.username);
        while (await User.findOne({ referralCode: code })) {
          code = generateReferralCode(user.username);
        }
        user.referralCode = code;
        await user.save();
      }

      const token = jwt.sign(
        { id: user._id.toString(), username: user.username, email: user.email, role: user.role },
        JWT_SECRET,
        { expiresIn: '7d' },
      );

      res.status(200).json({
        data: {
          token,
          user: {
            username: user.username,
            email: user.email,
            gender: user.gender,
            phoneNumber: user.phoneNumber,
            role: user.role,
            referralCode: user.referralCode,
            referralCount: user.referralCount,
            loyaltyCredits: user.loyaltyCredits,
          },
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
      const username = req.user?.username;
      if (!username) {
        res.status(401).json({ error: 'Unauthorized.' });
        return;
      }

      const user = await User.findOne({ username }).select('-password');
      if (!user) {
        res.status(404).json({ error: 'User not found.' });
        return;
      }

      res.status(200).json({ data: user });
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
      const currentUsername = req.user?.username;
      if (!currentUsername) {
        res.status(401).json({ error: 'Unauthorized.' });
        return;
      }

      const { username, email, gender, phoneNumber } = req.body as {
        username?: string;
        email?: string;
        gender?: string;
        phoneNumber?: string;
      };

      const user = await User.findOne({ username: currentUsername });
      if (!user) {
        res.status(404).json({ error: 'User not found.' });
        return;
      }

      if (username) user.username = username;
      if (email) user.email = email.toLowerCase();
      if (gender) user.gender = gender;
      if (phoneNumber) user.phoneNumber = phoneNumber;

      await user.save();

      res.status(200).json({
        data: {
          username: user.username,
          email: user.email,
          gender: user.gender,
          phoneNumber: user.phoneNumber,
          role: user.role,
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
      const users = await User.find({}).select('-password').sort({ createdAt: -1 });
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

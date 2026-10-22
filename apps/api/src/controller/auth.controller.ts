import type { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../model/index.js';

const JWT_SECRET = process.env['JWT_SECRET'] ?? 'jojo-flora-super-secret-jwt-key';

export class AuthController {
  /**
   * Register a new user.
   * POST /api/auth/register or /api/auth/signup
   */
  async register(req: Request, res: Response): Promise<void> {
    try {
      const { username, email, gender, phoneNumber, password } = req.body as {
        username?: string;
        email?: string;
        gender?: string;
        phoneNumber?: string;
        password?: string;
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

      // Create user
      const user = await User.create({
        username,
        email: email.toLowerCase(),
        gender,
        phoneNumber,
        password: hashedPassword,
      });

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
}

export const authController = new AuthController();

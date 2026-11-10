import { Router } from 'express';
import { authController } from '../controller/index.js';
import { authenticate } from '../middleware/index.js';

export const authRouter = Router();

authRouter.get('/status', (req, res) => {
  authController.getAuthStatus(req, res);
});

authRouter.post('/register', (req, res) => {
  void authController.register(req, res);
});

authRouter.post('/signup', (req, res) => {
  void authController.register(req, res);
});

authRouter.post('/verify-otp', (req, res) => {
  void authController.verifyOtp(req, res);
});

authRouter.post('/resend-otp', (req, res) => {
  void authController.resendOtp(req, res);
});

authRouter.post('/forgot-password', (req, res) => {
  void authController.forgotPassword(req, res);
});

authRouter.post('/reset-password', (req, res) => {
  void authController.resetPassword(req, res);
});

authRouter.put('/change-password', authenticate, (req, res) => {
  void authController.changePassword(req, res);
});

authRouter.get('/better-session', (req, res) => {
  void authController.getBetterSession(req, res);
});

authRouter.post('/login', (req, res) => {
  void authController.login(req, res);
});

authRouter.get('/me', authenticate, (req, res) => {
  void authController.getProfile(req, res);
});

authRouter.get('/profile', authenticate, (req, res) => {
  void authController.getProfile(req, res);
});

authRouter.put('/profile', authenticate, (req, res) => {
  void authController.updateProfile(req, res);
});

authRouter.get('/users', (req, res) => {
  void authController.getAllUsers(req, res);
});

authRouter.patch('/role', (req, res) => {
  void authController.updateRole(req, res);
});

authRouter.delete('/users/:id', (req, res) => {
  void authController.deleteUser(req, res);
});

authRouter.post('/users/:id/notes', (req, res) => {
  void authController.addAdminNote(req, res);
});

authRouter.patch('/users/:id/flag', (req, res) => {
  void authController.updateCustomerFlag(req, res);
});

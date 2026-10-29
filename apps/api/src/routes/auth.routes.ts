import { Router } from 'express';
import { authController } from '../controller/index.js';
import { authenticate } from '../middleware/index.js';

export const authRouter = Router();

authRouter.post('/register', (req, res) => {
  void authController.register(req, res);
});

authRouter.post('/signup', (req, res) => {
  void authController.register(req, res);
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

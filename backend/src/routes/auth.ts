import { Router } from 'express';
import {
  signup,
  login,
  getCurrentUser,
  logout,
} from '../controllers/auth.controller';
import { authenticateJWT } from '../middleware/auth';
import { validateSignup, validateLogin } from '../middleware/validation';

const router = Router();

/**
 * @route   POST /auth/signup
 * @desc    用户注册
 * @access  Public
 */
router.post('/signup', validateSignup, signup);

/**
 * @route   POST /auth/login
 * @desc    用户登录
 * @access  Public
 */
router.post('/login', validateLogin, login);

/**
 * @route   GET /auth/me
 * @desc    获取当前用户信息
 * @access  Private (需要 JWT)
 */
router.get('/me', authenticateJWT, getCurrentUser);

/**
 * @route   POST /auth/logout
 * @desc    用户登出
 * @access  Private (需要 JWT)
 */
router.post('/logout', authenticateJWT, logout);

export default router;

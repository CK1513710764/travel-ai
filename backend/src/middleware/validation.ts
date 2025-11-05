import { Request, Response, NextFunction } from 'express';

/**
 * 输入验证中间件
 */

/**
 * 验证 email 格式
 */
const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * 验证密码强度
 * 要求：至少 6 个字符
 */
const isValidPassword = (password: string): boolean => {
  return !!(password && password.length >= 6);
};

/**
 * 验证注册输入
 */
export const validateSignup = (req: Request, res: Response, next: NextFunction) => {
  const { email, password, fullName } = req.body;

  // 验证必填字段
  if (!email) {
    return res.status(400).json({
      error: 'Email is required',
    });
  }

  if (!password) {
    return res.status(400).json({
      error: 'Password is required',
    });
  }

  // 验证 email 格式
  if (!isValidEmail(email)) {
    return res.status(400).json({
      error: 'Invalid email format',
    });
  }

  // 验证密码强度
  if (!isValidPassword(password)) {
    return res.status(400).json({
      error: 'Password must be at least 6 characters long',
    });
  }

  next();
};

/**
 * 验证登录输入
 */
export const validateLogin = (req: Request, res: Response, next: NextFunction) => {
  const { email, password } = req.body;

  if (!email) {
    return res.status(400).json({
      error: 'Email is required',
    });
  }

  if (!password) {
    return res.status(400).json({
      error: 'Password is required',
    });
  }

  next();
};

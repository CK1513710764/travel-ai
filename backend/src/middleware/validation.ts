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

/**
 * 验证创建旅行计划输入
 */
export const validateCreateTrip = (req: Request, res: Response, next: NextFunction) => {
  const { title, destination, startDate, endDate, travelerCount } = req.body;

  // 验证必填字段
  if (!title) {
    return res.status(400).json({
      error: 'Title is required',
    });
  }

  if (!destination) {
    return res.status(400).json({
      error: 'Destination is required',
    });
  }

  if (!startDate) {
    return res.status(400).json({
      error: 'Start date is required',
    });
  }

  if (!endDate) {
    return res.status(400).json({
      error: 'End date is required',
    });
  }

  if (travelerCount === undefined || travelerCount === null) {
    return res.status(400).json({
      error: 'Traveler count is required',
    });
  }

  // 验证旅行人数
  if (travelerCount < 1) {
    return res.status(400).json({
      error: 'Traveler count must be at least 1',
    });
  }

  // 验证日期范围
  const start = new Date(startDate);
  const end = new Date(endDate);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return res.status(400).json({
      error: 'Invalid date format',
    });
  }

  if (end < start) {
    return res.status(400).json({
      error: 'End date must be after start date',
    });
  }

  next();
};

/**
 * 验证更新旅行计划输入
 */
export const validateUpdateTrip = (req: Request, res: Response, next: NextFunction) => {
  const { startDate, endDate, travelerCount } = req.body;

  // 如果提供了旅行人数，验证
  if (travelerCount !== undefined && travelerCount < 1) {
    return res.status(400).json({
      error: 'Traveler count must be at least 1',
    });
  }

  // 如果同时提供了开始和结束日期，验证日期范围
  if (startDate && endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({
        error: 'Invalid date format',
      });
    }

    if (end < start) {
      return res.status(400).json({
        error: 'End date must be after start date',
      });
    }
  }

  next();
};

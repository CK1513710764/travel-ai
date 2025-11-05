import { Request, Response, NextFunction } from 'express';
import { supabase } from '../config/supabase';

/**
 * JWT 认证中间件
 * 验证请求中的 JWT token
 */
export const authenticateJWT = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // 从 Authorization header 获取 token
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'No token provided',
      });
    }

    const token = authHeader.substring(7); // 移除 "Bearer " 前缀

    // 使用 Supabase 验证 token
    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data.user) {
      return res.status(401).json({
        error: 'Invalid or expired token',
      });
    }

    // 将用户信息附加到请求对象
    (req as any).user = data.user;

    next();
  } catch (error) {
    console.error('JWT authentication error:', error);
    return res.status(401).json({
      error: 'Authentication failed',
    });
  }
};

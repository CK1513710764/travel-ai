import { Request, Response } from 'express';
import { supabase } from '../config/supabase';

/**
 * 认证控制器
 * 处理用户注册、登录、登出等认证相关逻辑
 */

/**
 * POST /auth/signup - 用户注册
 */
export const signup = async (req: Request, res: Response) => {
  try {
    const { email, password, fullName } = req.body;

    // 使用 Supabase Auth 注册用户
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
        emailRedirectTo: undefined, // 测试环境不需要邮箱验证
      },
    });

    if (error) {
      // 处理已存在的用户
      if (error.message.includes('already registered')) {
        return res.status(409).json({
          error: 'Email already exists',
        });
      }

      return res.status(400).json({
        error: error.message,
      });
    }

    // 如果注册成功，创建 profile 记录
    if (data.user) {
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: data.user.id,
          username: email.split('@')[0], // 使用 email 前缀作为默认用户名
          full_name: fullName,
        });

      if (profileError) {
        console.error('Failed to create profile:', profileError);
        // 不影响注册流程，profile 可以后续补充
      }
    }

    return res.status(201).json({
      user: data.user,
      session: data.session,
    });
  } catch (error) {
    console.error('Signup error:', error);
    return res.status(500).json({
      error: 'Internal server error',
    });
  }
};

/**
 * POST /auth/login - 用户登录
 */
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // 使用 Supabase Auth 登录
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return res.status(401).json({
        error: 'Invalid credentials',
      });
    }

    return res.status(200).json({
      user: data.user,
      session: data.session,
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      error: 'Internal server error',
    });
  }
};

/**
 * GET /auth/me - 获取当前用户信息
 * 需要 JWT 认证
 */
export const getCurrentUser = async (req: Request, res: Response) => {
  try {
    // JWT 中间件会将用户信息附加到 req.user
    const user = (req as any).user;

    if (!user) {
      return res.status(401).json({
        error: 'Unauthorized',
      });
    }

    // 获取用户的 profile 信息
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    return res.status(200).json({
      user: {
        id: user.id,
        email: user.email,
        profile,
      },
    });
  } catch (error) {
    console.error('Get current user error:', error);
    return res.status(500).json({
      error: 'Internal server error',
    });
  }
};

/**
 * POST /auth/logout - 用户登出
 * 需要 JWT 认证
 */
export const logout = async (req: Request, res: Response) => {
  try {
    // 在服务端，Supabase logout 主要是客户端清除 session
    // 服务端可以将 token 加入黑名单（需要额外实现）
    // 这里我们简单返回成功，实际的 token 失效由 Supabase 管理

    return res.status(200).json({
      message: 'Logout successful',
    });
  } catch (error) {
    console.error('Logout error:', error);
    return res.status(500).json({
      error: 'Internal server error',
    });
  }
};

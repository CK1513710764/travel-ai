import { createClient, SupabaseClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

// Supabase 配置验证
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  throw new Error('Missing SUPABASE_URL environment variable');
}

if (!supabaseAnonKey) {
  throw new Error('Missing SUPABASE_ANON_KEY environment variable');
}

if (!supabaseServiceRoleKey) {
  throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY environment variable');
}

/**
 * Supabase 客户端（使用 anon key，用于客户端代理请求）
 * - 受 Row Level Security (RLS) 策略保护
 * - 适用于需要用户上下文的操作
 */
export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: false, // 服务端不需要持久化 session
  },
});

/**
 * Supabase Admin 客户端（使用 service_role key）
 * - ⚠️ 绕过 RLS 策略，拥有完全访问权限
 * - ⚠️ 仅用于管理操作，谨慎使用
 * - 适用于系统级操作（如数据迁移、管理功能）
 */
export const supabaseAdmin: SupabaseClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

/**
 * 从请求 header 中提取 JWT token 并设置 Supabase 客户端
 * @param authHeader - Authorization header (Bearer token)
 * @returns 配置了用户上下文的 Supabase 客户端
 */
export const getSupabaseClient = (authHeader?: string): SupabaseClient => {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return supabase;
  }

  const token = authHeader.substring(7); // 移除 "Bearer " 前缀

  // 创建带有用户 token 的客户端实例
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
};

export default supabase;

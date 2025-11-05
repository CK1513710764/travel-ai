/**
 * 数据库集成测试
 *
 * 注意：这些测试需要真实的 Supabase 项目和有效凭据
 * 在运行前确保 .env 文件中配置了正确的 SUPABASE_URL 和 SUPABASE_ANON_KEY
 *
 * 运行测试：npm test -- database.integration.test.ts
 */

import { supabase, supabaseAdmin } from '../config/supabase';

describe('Database Integration Tests', () => {
  // 跳过测试如果没有配置 Supabase
  const skipIfNoSupabase = () => {
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
      console.warn('⚠️  Skipping database tests: SUPABASE credentials not configured');
      return true;
    }
    return false;
  };

  describe('Supabase Connection', () => {
    it('should successfully connect to Supabase', async () => {
      if (skipIfNoSupabase()) {
        return;
      }

      // 测试基本查询
      const { data, error } = await supabase
        .from('profiles')
        .select('id')
        .limit(1);

      // 即使没有数据，查询也应该成功（不应该有错误）
      expect(error).toBeNull();
      expect(data).toBeDefined();
    });

    it('should have admin client configured', () => {
      expect(supabaseAdmin).toBeDefined();
    });
  });

  describe('Database Schema Validation', () => {
    it('should have profiles table', async () => {
      if (skipIfNoSupabase()) {
        return;
      }

      const { error } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .limit(0);

      expect(error).toBeNull();
    });

    it('should have trips table', async () => {
      if (skipIfNoSupabase()) {
        return;
      }

      const { error } = await supabaseAdmin
        .from('trips')
        .select('*')
        .limit(0);

      expect(error).toBeNull();
    });

    it('should have expenses table', async () => {
      if (skipIfNoSupabase()) {
        return;
      }

      const { error } = await supabaseAdmin
        .from('expenses')
        .select('*')
        .limit(0);

      expect(error).toBeNull();
    });

    it('should have trip_preferences table', async () => {
      if (skipIfNoSupabase()) {
        return;
      }

      const { error } = await supabaseAdmin
        .from('trip_preferences')
        .select('*')
        .limit(0);

      expect(error).toBeNull();
    });
  });

  describe('Row Level Security (RLS)', () => {
    it('should enforce RLS on profiles table', async () => {
      if (skipIfNoSupabase()) {
        return;
      }

      // 未认证用户尝试插入应该失败（RLS 阻止）
      const { error } = await supabase
        .from('profiles')
        .insert({
          id: '00000000-0000-0000-0000-000000000000',
          username: 'test_user',
          full_name: 'Test User',
        });

      // 应该有错误（RLS 策略阻止）
      expect(error).not.toBeNull();
    });

    it('should enforce RLS on trips table', async () => {
      if (skipIfNoSupabase()) {
        return;
      }

      // 未认证用户尝试插入应该失败
      const { error } = await supabase
        .from('trips')
        .insert({
          user_id: '00000000-0000-0000-0000-000000000000',
          title: 'Test Trip',
          destination: 'Beijing',
          start_date: '2025-06-01',
          end_date: '2025-06-07',
          traveler_count: 2,
          budget_total: 5000,
        });

      expect(error).not.toBeNull();
    });
  });

  describe('Database Functions', () => {
    it('should have get_trip_total_expenses function', async () => {
      if (skipIfNoSupabase()) {
        return;
      }

      // 测试函数是否存在（使用虚拟 UUID）
      const { error } = await supabaseAdmin.rpc('get_trip_total_expenses', {
        trip_uuid: '00000000-0000-0000-0000-000000000000',
      });

      // 函数应该存在，即使 trip 不存在也应该返回 0（无错误）
      expect(error).toBeNull();
    });

    it('should have get_trip_expenses_by_category function', async () => {
      if (skipIfNoSupabase()) {
        return;
      }

      const { error } = await supabaseAdmin.rpc('get_trip_expenses_by_category', {
        trip_uuid: '00000000-0000-0000-0000-000000000000',
      });

      expect(error).toBeNull();
    });
  });
});

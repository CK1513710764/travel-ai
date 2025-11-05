-- Travel AI Database Schema - Initial Migration
-- Created: 2025-01-05
-- Description: 创建核心数据表和 Row Level Security 策略

-- ============================================================================
-- 1. USERS TABLE (扩展 Supabase Auth)
-- ============================================================================
-- 注意：Supabase Auth 自带 auth.users 表，我们创建一个 public.profiles 表来存储额外信息

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username VARCHAR(50) UNIQUE,
  full_name VARCHAR(100),
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 添加索引
CREATE INDEX IF NOT EXISTS profiles_username_idx ON public.profiles(username);

-- ============================================================================
-- 2. TRIP_PREFERENCES TABLE (用户旅行偏好)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.trip_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- 偏好设置
  preferred_cuisines TEXT[], -- 偏好美食类型 (数组)
  preferred_activities TEXT[], -- 偏好活动类型
  accommodation_types TEXT[], -- 住宿类型偏好
  budget_level VARCHAR(20) CHECK (budget_level IN ('economy', 'moderate', 'luxury')),
  travel_pace VARCHAR(20) CHECK (travel_pace IN ('relaxed', 'moderate', 'packed')),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- 每个用户只能有一条偏好记录
  UNIQUE(user_id)
);

CREATE INDEX IF NOT EXISTS trip_preferences_user_id_idx ON public.trip_preferences(user_id);

-- ============================================================================
-- 3. TRIPS TABLE (旅行计划)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.trips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- 基本信息
  title VARCHAR(200) NOT NULL,
  destination VARCHAR(200) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,

  -- 旅行参数
  traveler_count INTEGER NOT NULL DEFAULT 1 CHECK (traveler_count > 0),
  budget_total DECIMAL(10, 2) CHECK (budget_total >= 0),
  currency VARCHAR(3) DEFAULT 'CNY',

  -- AI 生成的行程
  itinerary JSONB, -- 存储 AI 生成的详细行程 (JSON 格式)
  ai_generated_at TIMESTAMPTZ,

  -- 元数据
  status VARCHAR(20) DEFAULT 'planning' CHECK (status IN ('planning', 'confirmed', 'in_progress', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- 约束：结束日期必须晚于开始日期
  CONSTRAINT valid_date_range CHECK (end_date >= start_date)
);

-- 添加索引
CREATE INDEX IF NOT EXISTS trips_user_id_idx ON public.trips(user_id);
CREATE INDEX IF NOT EXISTS trips_start_date_idx ON public.trips(start_date);
CREATE INDEX IF NOT EXISTS trips_status_idx ON public.trips(status);

-- ============================================================================
-- 4. EXPENSES TABLE (旅行花费记录)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- 花费详情
  category VARCHAR(50) NOT NULL, -- 类别：交通、住宿、餐饮、门票、购物等
  amount DECIMAL(10, 2) NOT NULL CHECK (amount >= 0),
  currency VARCHAR(3) DEFAULT 'CNY',
  description TEXT,
  expense_date DATE NOT NULL,

  -- 元数据
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 添加索引
CREATE INDEX IF NOT EXISTS expenses_trip_id_idx ON public.expenses(trip_id);
CREATE INDEX IF NOT EXISTS expenses_user_id_idx ON public.expenses(user_id);
CREATE INDEX IF NOT EXISTS expenses_expense_date_idx ON public.expenses(expense_date);
CREATE INDEX IF NOT EXISTS expenses_category_idx ON public.expenses(category);

-- ============================================================================
-- 5. TRIGGERS - 自动更新 updated_at 时间戳
-- ============================================================================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 为所有表添加 updated_at 触发器
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_trip_preferences_updated_at
  BEFORE UPDATE ON public.trip_preferences
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_trips_updated_at
  BEFORE UPDATE ON public.trips
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_expenses_updated_at
  BEFORE UPDATE ON public.expenses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- 6. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- 启用 RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

-- ----------- PROFILES RLS -----------

-- 用户可以查看所有 profiles (用于社交功能，如果需要)
CREATE POLICY "Profiles are viewable by everyone"
  ON public.profiles FOR SELECT
  USING (true);

-- 用户只能插入自己的 profile
CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- 用户只能更新自己的 profile
CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- ----------- TRIP_PREFERENCES RLS -----------

-- 用户只能查看自己的偏好
CREATE POLICY "Users can view their own preferences"
  ON public.trip_preferences FOR SELECT
  USING (auth.uid() = user_id);

-- 用户只能插入自己的偏好
CREATE POLICY "Users can insert their own preferences"
  ON public.trip_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 用户只能更新自己的偏好
CREATE POLICY "Users can update their own preferences"
  ON public.trip_preferences FOR UPDATE
  USING (auth.uid() = user_id);

-- ----------- TRIPS RLS -----------

-- 用户只能查看自己的旅行计划
CREATE POLICY "Users can view their own trips"
  ON public.trips FOR SELECT
  USING (auth.uid() = user_id);

-- 用户只能创建自己的旅行计划
CREATE POLICY "Users can insert their own trips"
  ON public.trips FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 用户只能更新自己的旅行计划
CREATE POLICY "Users can update their own trips"
  ON public.trips FOR UPDATE
  USING (auth.uid() = user_id);

-- 用户只能删除自己的旅行计划
CREATE POLICY "Users can delete their own trips"
  ON public.trips FOR DELETE
  USING (auth.uid() = user_id);

-- ----------- EXPENSES RLS -----------

-- 用户只能查看自己的花费记录
CREATE POLICY "Users can view their own expenses"
  ON public.expenses FOR SELECT
  USING (auth.uid() = user_id);

-- 用户只能创建自己的花费记录
CREATE POLICY "Users can insert their own expenses"
  ON public.expenses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 用户只能更新自己的花费记录
CREATE POLICY "Users can update their own expenses"
  ON public.expenses FOR UPDATE
  USING (auth.uid() = user_id);

-- 用户只能删除自己的花费记录
CREATE POLICY "Users can delete their own expenses"
  ON public.expenses FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- 7. FUNCTIONS - 实用函数
-- ============================================================================

-- 计算旅行的总花费
CREATE OR REPLACE FUNCTION public.get_trip_total_expenses(trip_uuid UUID)
RETURNS DECIMAL(10, 2) AS $$
  SELECT COALESCE(SUM(amount), 0)
  FROM public.expenses
  WHERE trip_id = trip_uuid;
$$ LANGUAGE sql STABLE;

-- 获取旅行的花费统计（按类别）
CREATE OR REPLACE FUNCTION public.get_trip_expenses_by_category(trip_uuid UUID)
RETURNS TABLE(category VARCHAR, total_amount DECIMAL) AS $$
  SELECT category, SUM(amount) as total_amount
  FROM public.expenses
  WHERE trip_id = trip_uuid
  GROUP BY category
  ORDER BY total_amount DESC;
$$ LANGUAGE sql STABLE;

-- ============================================================================
-- 完成
-- ============================================================================

COMMENT ON TABLE public.profiles IS '用户扩展信息表（扩展 Supabase Auth）';
COMMENT ON TABLE public.trip_preferences IS '用户旅行偏好设置';
COMMENT ON TABLE public.trips IS '旅行计划主表';
COMMENT ON TABLE public.expenses IS '旅行花费记录表';

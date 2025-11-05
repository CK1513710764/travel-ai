# 数据库设计文档 (Database Design Document)

## 文档信息

| 项目名称 | AI 旅行规划师 (AI Travel Planner) |
|---------|----------------------------------|
| 文档版本 | v1.0 |
| 数据库类型 | PostgreSQL (Supabase) |
| 创建日期 | 2025-11-04 |

---

## 目录

1. [数据库选型](#1-数据库选型)
2. [ER 图](#2-er-图)
3. [表结构设计](#3-表结构设计)
4. [Row Level Security (RLS) 策略](#4-row-level-security-rls-策略)
5. [索引设计](#5-索引设计)
6. [迁移脚本](#6-迁移脚本)
7. [数据字典](#7-数据字典)

---

## 1. 数据库选型

### 1.1 为什么选择 PostgreSQL

| 特性 | PostgreSQL | MySQL | MongoDB |
|------|-----------|-------|---------|
| **ACID 事务** | ✅ 完整支持 | ✅ 支持 | ⚠️ 有限支持 |
| **JSON 支持** | ✅ JSONB 高性能 | ⚠️ 基础支持 | ✅ 原生支持 |
| **复杂查询** | ✅ 强大 | ✅ 良好 | ⚠️ 有限 |
| **全文搜索** | ✅ 内置 | ⚠️ 需额外配置 | ✅ 内置 |
| **RLS 安全** | ✅ 原生支持 | ❌ 不支持 | ❌ 不支持 |
| **扩展性** | ✅ 丰富插件 | ⚠️ 一般 | ✅ 水平扩展好 |

**结论**: PostgreSQL 的 JSONB 支持完美适配我们的行程数据（嵌套结构），RLS 策略提供数据库级别的安全隔离，是最佳选择。

### 1.2 为什么选择 Supabase

- **一体化解决方案**: 数据库 + 认证 + 存储 + 实时订阅
- **自动化运维**: 自动备份、监控、扩展
- **开发者友好**: RESTful API、实时订阅、客户端 SDK
- **Row Level Security**: 原生支持 RLS，数据隔离安全可靠
- **免费额度**: 开发阶段免费使用

---

## 2. ER 图

### 2.1 实体关系图

```
┌─────────────────┐
│     users       │
│  (Supabase Auth)│
└────────┬────────┘
         │ 1
         │
         │ owns
         │
         │ *
┌────────▼────────┐           ┌──────────────────┐
│     trips       │───────────│  trip_preferences│
│                 │  1      1 │                  │
└────────┬────────┘           └──────────────────┘
         │ 1
         │
         │ has
         │
         │ *
┌────────▼────────┐
│    expenses     │
│                 │
└─────────────────┘
```

### 2.2 主要实体

| 实体 | 说明 | 关系 |
|------|------|------|
| **users** | 用户账户（由 Supabase Auth 管理） | 1 对多 trips |
| **trips** | 旅行计划 | 1 对多 expenses |
| **expenses** | 费用记录 | 多对 1 trips |
| **trip_preferences** | 用户旅行偏好 | 1 对 1 users |

---

## 3. 表结构设计

### 3.1 users 表

**说明**: 用户表由 Supabase Auth 自动管理，无需手动创建。我们只需要引用 `auth.users` 的 `id` 字段。

Supabase Auth 自动提供的字段：
- `id` (UUID): 主键
- `email` (String): 邮箱
- `encrypted_password` (String): 加密密码
- `email_confirmed_at` (Timestamp): 邮箱验证时间
- `created_at` (Timestamp): 创建时间

---

### 3.2 trips 表

**说明**: 存储用户的旅行计划信息。

```sql
CREATE TABLE trips (
  -- 主键
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 外键：关联用户
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- 基本信息
  destination VARCHAR(100) NOT NULL,           -- 目的地城市
  start_date DATE NOT NULL,                    -- 出发日期
  end_date DATE NOT NULL,                      -- 返回日期
  budget DECIMAL(10, 2) NOT NULL,              -- 预算（元）
  num_travelers INTEGER NOT NULL DEFAULT 1,    -- 同行人数

  -- 旅行偏好
  travel_style VARCHAR(50),                    -- 旅行风格：adventure/cultural/leisure/foodie
  preferences JSONB,                           -- 其他偏好（JSON格式）

  -- AI 生成的行程（JSON格式）
  itinerary JSONB,

  -- 预算分析（JSON格式）
  budget_breakdown JSONB,

  -- 元数据
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- 约束
  CONSTRAINT valid_dates CHECK (end_date >= start_date),
  CONSTRAINT positive_budget CHECK (budget > 0),
  CONSTRAINT positive_travelers CHECK (num_travelers > 0)
);

-- 索引
CREATE INDEX idx_trips_user_id ON trips(user_id);
CREATE INDEX idx_trips_start_date ON trips(start_date);
CREATE INDEX idx_trips_destination ON trips(destination);

-- 自动更新 updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_trips_updated_at
BEFORE UPDATE ON trips
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- 添加注释
COMMENT ON TABLE trips IS '旅行计划表';
COMMENT ON COLUMN trips.itinerary IS 'AI 生成的详细行程，JSON 格式';
COMMENT ON COLUMN trips.budget_breakdown IS '预算分类明细，JSON 格式';
```

#### itinerary 字段结构示例

```json
{
  "days": [
    {
      "day": 1,
      "date": "2025-11-15",
      "activities": [
        {
          "time": "9:00-12:00",
          "type": "景点",
          "name": "西湖",
          "description": "游览西湖风景区，欣赏断桥残雪、苏堤春晓",
          "address": "杭州市西湖区西湖风景名胜区",
          "location": {
            "lng": 120.148262,
            "lat": 30.259244
          },
          "cost": 0,
          "duration": 180,
          "images": ["https://..."]
        },
        {
          "time": "12:00-13:30",
          "type": "餐厅",
          "name": "外婆家(湖滨店)",
          "description": "杭帮菜连锁品牌，性价比高",
          "address": "杭州市上城区平海路124号",
          "location": {
            "lng": 120.165892,
            "lat": 30.256441
          },
          "cost": 160,
          "cuisine": "杭帮菜"
        }
      ],
      "accommodation": {
        "name": "汉庭酒店(西湖店)",
        "address": "杭州市上城区...",
        "location": {
          "lng": 120.162,
          "lat": 30.254
        },
        "cost": 300
      },
      "daily_cost": 980
    }
  ],
  "summary": {
    "total_distance": "35km",
    "total_days": 3,
    "total_cost": 2880
  }
}
```

#### budget_breakdown 字段结构示例

```json
{
  "transportation": 600,
  "accommodation": 900,
  "food": 720,
  "tickets": 460,
  "others": 200,
  "total": 2880
}
```

---

### 3.3 expenses 表

**说明**: 记录用户旅行中的实际开销。

```sql
CREATE TABLE expenses (
  -- 主键
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 外键：关联行程
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,

  -- 费用信息
  category VARCHAR(50) NOT NULL,               -- 类别：transportation/accommodation/food/tickets/others
  amount DECIMAL(10, 2) NOT NULL,              -- 金额（元）
  currency VARCHAR(10) NOT NULL DEFAULT 'CNY', -- 货币类型
  description TEXT,                            -- 描述/备注
  expense_date DATE NOT NULL,                  -- 开销日期

  -- 元数据
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- 约束
  CONSTRAINT positive_amount CHECK (amount > 0),
  CONSTRAINT valid_category CHECK (category IN ('transportation', 'accommodation', 'food', 'tickets', 'others'))
);

-- 索引
CREATE INDEX idx_expenses_trip_id ON expenses(trip_id);
CREATE INDEX idx_expenses_date ON expenses(expense_date);
CREATE INDEX idx_expenses_category ON expenses(category);

-- 添加注释
COMMENT ON TABLE expenses IS '旅行费用记录表';
COMMENT ON COLUMN expenses.category IS '费用类别：transportation（交通）/accommodation（住宿）/food（餐饮）/tickets（门票）/others（其他）';
```

---

### 3.4 trip_preferences 表

**说明**: 存储用户的旅行偏好设置，用于个性化推荐。

```sql
CREATE TABLE trip_preferences (
  -- 主键：用户 ID
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,

  -- 偏好设置
  preferred_cuisines TEXT[],                   -- 偏好菜系
  activity_interests TEXT[],                   -- 活动兴趣（hiking, museums, beaches等）
  accommodation_types TEXT[],                  -- 住宿偏好（hotel, airbnb, hostel）
  budget_preference VARCHAR(50),               -- 预算偏好：low/medium/high/luxury

  -- 元数据
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 自动更新 updated_at
CREATE TRIGGER update_trip_preferences_updated_at
BEFORE UPDATE ON trip_preferences
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- 添加注释
COMMENT ON TABLE trip_preferences IS '用户旅行偏好设置表';
COMMENT ON COLUMN trip_preferences.preferred_cuisines IS '偏好菜系，如：[川菜, 粤菜, 本地特色]';
COMMENT ON COLUMN trip_preferences.activity_interests IS '活动兴趣，如：[hiking, museums, beaches, shopping]';
```

---

## 4. Row Level Security (RLS) 策略

### 4.1 什么是 RLS

Row Level Security (行级安全策略) 是 PostgreSQL 提供的数据库级别安全机制，确保用户只能访问自己的数据。

### 4.2 启用 RLS

```sql
-- 为所有表启用 RLS
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE trip_preferences ENABLE ROW LEVEL SECURITY;
```

### 4.3 trips 表 RLS 策略

```sql
-- 用户只能查看自己的行程
CREATE POLICY "Users can view their own trips"
  ON trips
  FOR SELECT
  USING (auth.uid() = user_id);

-- 用户可以创建自己的行程
CREATE POLICY "Users can create their own trips"
  ON trips
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 用户可以更新自己的行程
CREATE POLICY "Users can update their own trips"
  ON trips
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 用户可以删除自己的行程
CREATE POLICY "Users can delete their own trips"
  ON trips
  FOR DELETE
  USING (auth.uid() = user_id);
```

### 4.4 expenses 表 RLS 策略

```sql
-- 用户只能查看自己行程的费用记录
CREATE POLICY "Users can view expenses of their trips"
  ON expenses
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM trips
      WHERE trips.id = expenses.trip_id
      AND trips.user_id = auth.uid()
    )
  );

-- 用户可以为自己的行程添加费用记录
CREATE POLICY "Users can create expenses for their trips"
  ON expenses
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM trips
      WHERE trips.id = expenses.trip_id
      AND trips.user_id = auth.uid()
    )
  );

-- 用户可以更新自己行程的费用记录
CREATE POLICY "Users can update expenses of their trips"
  ON expenses
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM trips
      WHERE trips.id = expenses.trip_id
      AND trips.user_id = auth.uid()
    )
  );

-- 用户可以删除自己行程的费用记录
CREATE POLICY "Users can delete expenses of their trips"
  ON expenses
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM trips
      WHERE trips.id = expenses.trip_id
      AND trips.user_id = auth.uid()
    )
  );
```

### 4.5 trip_preferences 表 RLS 策略

```sql
-- 用户只能查看自己的偏好设置
CREATE POLICY "Users can view their own preferences"
  ON trip_preferences
  FOR SELECT
  USING (auth.uid() = user_id);

-- 用户可以创建自己的偏好设置
CREATE POLICY "Users can create their own preferences"
  ON trip_preferences
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 用户可以更新自己的偏好设置
CREATE POLICY "Users can update their own preferences"
  ON trip_preferences
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 用户可以删除自己的偏好设置
CREATE POLICY "Users can delete their own preferences"
  ON trip_preferences
  FOR DELETE
  USING (auth.uid() = user_id);
```

---

## 5. 索引设计

### 5.1 索引策略

| 表 | 字段 | 索引类型 | 目的 |
|---|------|---------|------|
| **trips** | user_id | B-Tree | 快速查找用户的所有行程 |
| **trips** | start_date | B-Tree | 按日期排序和筛选 |
| **trips** | destination | B-Tree | 按目的地搜索 |
| **trips** | (user_id, start_date) | Composite | 优化复合查询 |
| **expenses** | trip_id | B-Tree | 快速查找行程的所有费用 |
| **expenses** | expense_date | B-Tree | 按日期排序 |
| **expenses** | category | B-Tree | 按类别统计 |

### 5.2 创建复合索引

```sql
-- 优化"查询用户某段时间的行程"
CREATE INDEX idx_trips_user_start_date
  ON trips(user_id, start_date DESC);

-- 优化"按目的地搜索用户行程"
CREATE INDEX idx_trips_user_destination
  ON trips(user_id, destination);

-- 优化"查询行程的某类别费用"
CREATE INDEX idx_expenses_trip_category
  ON expenses(trip_id, category);
```

### 5.3 JSONB 字段索引

```sql
-- 为 itinerary JSONB 字段创建 GIN 索引（用于全文搜索）
CREATE INDEX idx_trips_itinerary_gin
  ON trips USING GIN (itinerary);

-- 为 preferences JSONB 字段创建 GIN 索引
CREATE INDEX idx_trips_preferences_gin
  ON trips USING GIN (preferences);
```

---

## 6. 迁移脚本

### 6.1 初始化数据库

```sql
-- migrations/001_initial_schema.sql

-- 1. 创建 trips 表
CREATE TABLE trips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  destination VARCHAR(100) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  budget DECIMAL(10, 2) NOT NULL,
  num_travelers INTEGER NOT NULL DEFAULT 1,
  travel_style VARCHAR(50),
  preferences JSONB,
  itinerary JSONB,
  budget_breakdown JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT valid_dates CHECK (end_date >= start_date),
  CONSTRAINT positive_budget CHECK (budget > 0),
  CONSTRAINT positive_travelers CHECK (num_travelers > 0)
);

-- 2. 创建 expenses 表
CREATE TABLE expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  category VARCHAR(50) NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(10) NOT NULL DEFAULT 'CNY',
  description TEXT,
  expense_date DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT positive_amount CHECK (amount > 0),
  CONSTRAINT valid_category CHECK (category IN ('transportation', 'accommodation', 'food', 'tickets', 'others'))
);

-- 3. 创建 trip_preferences 表
CREATE TABLE trip_preferences (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  preferred_cuisines TEXT[],
  activity_interests TEXT[],
  accommodation_types TEXT[],
  budget_preference VARCHAR(50),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. 创建索引
CREATE INDEX idx_trips_user_id ON trips(user_id);
CREATE INDEX idx_trips_start_date ON trips(start_date);
CREATE INDEX idx_trips_destination ON trips(destination);
CREATE INDEX idx_trips_user_start_date ON trips(user_id, start_date DESC);

CREATE INDEX idx_expenses_trip_id ON expenses(trip_id);
CREATE INDEX idx_expenses_date ON expenses(expense_date);
CREATE INDEX idx_expenses_category ON expenses(category);

-- 5. 创建触发器函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. 创建触发器
CREATE TRIGGER update_trips_updated_at
BEFORE UPDATE ON trips
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_trip_preferences_updated_at
BEFORE UPDATE ON trip_preferences
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- 7. 启用 RLS
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE trip_preferences ENABLE ROW LEVEL SECURITY;

-- 8. 创建 RLS 策略（trips）
CREATE POLICY "Users can view their own trips"
  ON trips FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own trips"
  ON trips FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own trips"
  ON trips FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own trips"
  ON trips FOR DELETE
  USING (auth.uid() = user_id);

-- 9. 创建 RLS 策略（expenses）
CREATE POLICY "Users can view expenses of their trips"
  ON expenses FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM trips
      WHERE trips.id = expenses.trip_id
      AND trips.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create expenses for their trips"
  ON expenses FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM trips
      WHERE trips.id = expenses.trip_id
      AND trips.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update expenses of their trips"
  ON expenses FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM trips
      WHERE trips.id = expenses.trip_id
      AND trips.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete expenses of their trips"
  ON expenses FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM trips
      WHERE trips.id = expenses.trip_id
      AND trips.user_id = auth.uid()
    )
  );

-- 10. 创建 RLS 策略（trip_preferences）
CREATE POLICY "Users can view their own preferences"
  ON trip_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own preferences"
  ON trip_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own preferences"
  ON trip_preferences FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own preferences"
  ON trip_preferences FOR DELETE
  USING (auth.uid() = user_id);
```

### 6.2 执行迁移

使用 Supabase Dashboard 或 CLI 执行迁移：

```bash
# 使用 Supabase CLI
supabase db push

# 或手动在 Supabase Dashboard SQL Editor 中执行
```

---

## 7. 数据字典

### 7.1 trips 表

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | UUID | PK | 主键，自动生成 |
| user_id | UUID | FK, NOT NULL | 用户 ID，关联 auth.users |
| destination | VARCHAR(100) | NOT NULL | 目的地城市 |
| start_date | DATE | NOT NULL | 出发日期 |
| end_date | DATE | NOT NULL | 返回日期 |
| budget | DECIMAL(10,2) | NOT NULL, > 0 | 预算（元） |
| num_travelers | INTEGER | NOT NULL, DEFAULT 1, > 0 | 同行人数 |
| travel_style | VARCHAR(50) | - | 旅行风格（adventure/cultural/leisure/foodie） |
| preferences | JSONB | - | 其他偏好设置 |
| itinerary | JSONB | - | AI 生成的详细行程 |
| budget_breakdown | JSONB | - | 预算分类明细 |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | 创建时间 |
| updated_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | 更新时间 |

### 7.2 expenses 表

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | UUID | PK | 主键，自动生成 |
| trip_id | UUID | FK, NOT NULL | 行程 ID，关联 trips |
| category | VARCHAR(50) | NOT NULL, IN(...) | 费用类别（transportation/accommodation/food/tickets/others） |
| amount | DECIMAL(10,2) | NOT NULL, > 0 | 金额（元） |
| currency | VARCHAR(10) | NOT NULL, DEFAULT 'CNY' | 货币类型 |
| description | TEXT | - | 描述/备注 |
| expense_date | DATE | NOT NULL | 开销日期 |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | 创建时间 |

### 7.3 trip_preferences 表

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| user_id | UUID | PK, FK | 用户 ID，关联 auth.users |
| preferred_cuisines | TEXT[] | - | 偏好菜系数组 |
| activity_interests | TEXT[] | - | 活动兴趣数组 |
| accommodation_types | TEXT[] | - | 住宿偏好数组 |
| budget_preference | VARCHAR(50) | - | 预算偏好（low/medium/high/luxury） |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | 创建时间 |
| updated_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | 更新时间 |

---

## 8. 常用查询示例

### 8.1 查询用户的所有行程

```sql
SELECT
  id,
  destination,
  start_date,
  end_date,
  budget,
  num_travelers,
  created_at
FROM trips
WHERE user_id = '用户ID'
ORDER BY start_date DESC;
```

### 8.2 查询即将出发的行程

```sql
SELECT *
FROM trips
WHERE user_id = '用户ID'
  AND start_date >= CURRENT_DATE
  AND start_date <= CURRENT_DATE + INTERVAL '30 days'
ORDER BY start_date ASC;
```

### 8.3 统计某行程的总开销

```sql
SELECT
  trip_id,
  category,
  SUM(amount) as total,
  COUNT(*) as count
FROM expenses
WHERE trip_id = '行程ID'
GROUP BY trip_id, category
ORDER BY total DESC;
```

### 8.4 查询行程的预算 vs 实际对比

```sql
SELECT
  t.id,
  t.destination,
  t.budget as budget,
  COALESCE(SUM(e.amount), 0) as actual,
  t.budget - COALESCE(SUM(e.amount), 0) as remaining
FROM trips t
LEFT JOIN expenses e ON t.id = e.trip_id
WHERE t.user_id = '用户ID'
  AND t.id = '行程ID'
GROUP BY t.id;
```

### 8.5 全文搜索行程（搜索目的地或行程内容）

```sql
-- 搜索目的地
SELECT *
FROM trips
WHERE user_id = '用户ID'
  AND destination ILIKE '%杭州%';

-- 搜索行程内容（JSONB）
SELECT *
FROM trips
WHERE user_id = '用户ID'
  AND itinerary @> '{"days": [{"activities": [{"name": "西湖"}]}]}';
```

---

## 9. 数据备份与恢复

### 9.1 自动备份

Supabase 提供自动备份功能：
- **免费计划**: 每日备份，保留 7 天
- **付费计划**: 可配置备份频率和保留时间

### 9.2 手动备份

```bash
# 使用 pg_dump 导出数据
pg_dump -h db.xxx.supabase.co -U postgres -d postgres > backup.sql

# 恢复数据
psql -h db.xxx.supabase.co -U postgres -d postgres < backup.sql
```

---

## 10. 性能优化建议

### 10.1 查询优化

1. **使用索引**: 确保频繁查询的字段都有索引
2. **避免 SELECT ***: 只查询需要的字段
3. **分页查询**: 使用 LIMIT 和 OFFSET
4. **JSONB 查询优化**: 使用 GIN 索引加速 JSONB 查询

### 10.2 JSONB 字段优化

```sql
-- 创建 JSONB 字段的特定路径索引
CREATE INDEX idx_trips_itinerary_days
  ON trips USING GIN ((itinerary -> 'days'));

-- 查询时使用索引
SELECT * FROM trips
WHERE itinerary -> 'days' @> '[{"day": 1}]';
```

### 10.3 连接池配置

```typescript
// Supabase Client 自动管理连接池
// 可配置最大连接数
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  db: {
    poolSize: 10,  // 最大连接数
  },
});
```

---

## 附录

### A. Supabase 控制台操作

1. **创建项目**: [https://app.supabase.com](https://app.supabase.com)
2. **运行 SQL**: Dashboard → SQL Editor → 粘贴迁移脚本 → Run
3. **查看表**: Dashboard → Table Editor
4. **配置 RLS**: Dashboard → Authentication → Policies

### B. 参考资料

- [PostgreSQL 官方文档](https://www.postgresql.org/docs/)
- [Supabase 文档](https://supabase.com/docs)
- [Row Level Security 指南](https://supabase.com/docs/guides/auth/row-level-security)
- [JSONB 性能优化](https://www.postgresql.org/docs/current/datatype-json.html)

---

## 文档变更记录

| 版本 | 日期 | 修改人 | 变更说明 |
|------|------|--------|---------|
| v1.0 | 2025-11-04 | Claude | 初始版本，完整数据库设计文档 |


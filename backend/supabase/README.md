# Supabase 数据库设计文档

## 概述

本项目使用 Supabase 作为后端数据库和认证服务。数据库设计遵循以下原则：
- ✅ Row Level Security (RLS) 强制执行用户数据隔离
- ✅ 自动时间戳管理 (created_at, updated_at)
- ✅ 外键约束确保数据完整性
- ✅ 索引优化查询性能

## 数据表结构

### 1. `profiles` - 用户扩展信息

扩展 Supabase Auth 的用户信息。

| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键，关联 auth.users(id) |
| username | VARCHAR(50) | 用户名（唯一） |
| full_name | VARCHAR(100) | 全名 |
| avatar_url | TEXT | 头像 URL |
| created_at | TIMESTAMPTZ | 创建时间 |
| updated_at | TIMESTAMPTZ | 更新时间 |

**RLS 策略：**
- ✅ 所有人可查看
- ✅ 用户只能插入/更新自己的 profile

---

### 2. `trip_preferences` - 用户旅行偏好

| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| user_id | UUID | 关联用户 |
| preferred_cuisines | TEXT[] | 偏好美食类型（数组） |
| preferred_activities | TEXT[] | 偏好活动类型 |
| accommodation_types | TEXT[] | 住宿类型偏好 |
| budget_level | VARCHAR(20) | 预算等级：economy/moderate/luxury |
| travel_pace | VARCHAR(20) | 旅行节奏：relaxed/moderate/packed |
| created_at | TIMESTAMPTZ | 创建时间 |
| updated_at | TIMESTAMPTZ | 更新时间 |

**约束：** 每个用户只能有一条偏好记录 (UNIQUE user_id)

**RLS 策略：**
- ✅ 用户只能查看/插入/更新自己的偏好

---

### 3. `trips` - 旅行计划

核心业务表，存储用户的旅行计划。

| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| user_id | UUID | 关联用户 |
| title | VARCHAR(200) | 旅行标题 |
| destination | VARCHAR(200) | 目的地 |
| start_date | DATE | 开始日期 |
| end_date | DATE | 结束日期 |
| traveler_count | INTEGER | 旅行人数（>0） |
| budget_total | DECIMAL(10,2) | 总预算 |
| currency | VARCHAR(3) | 货币代码（默认 CNY） |
| itinerary | JSONB | AI 生成的行程（JSON） |
| ai_generated_at | TIMESTAMPTZ | AI 生成时间 |
| status | VARCHAR(20) | 状态：planning/confirmed/in_progress/completed/cancelled |
| created_at | TIMESTAMPTZ | 创建时间 |
| updated_at | TIMESTAMPTZ | 更新时间 |

**约束：**
- `end_date >= start_date`
- `traveler_count > 0`

**RLS 策略：**
- ✅ 用户可对自己的旅行计划执行完整 CRUD

---

### 4. `expenses` - 旅行花费记录

追踪实际旅行花费。

| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| trip_id | UUID | 关联旅行计划 |
| user_id | UUID | 关联用户 |
| category | VARCHAR(50) | 类别：交通/住宿/餐饮/门票/购物等 |
| amount | DECIMAL(10,2) | 金额（>=0） |
| currency | VARCHAR(3) | 货币代码（默认 CNY） |
| description | TEXT | 描述 |
| expense_date | DATE | 花费日期 |
| created_at | TIMESTAMPTZ | 创建时间 |
| updated_at | TIMESTAMPTZ | 更新时间 |

**RLS 策略：**
- ✅ 用户可对自己的花费记录执行完整 CRUD

---

## 实用函数

### `get_trip_total_expenses(trip_uuid UUID)`
计算某个旅行的总花费。

```sql
SELECT get_trip_total_expenses('trip-uuid-here');
```

### `get_trip_expenses_by_category(trip_uuid UUID)`
获取某个旅行的花费统计（按类别分组）。

```sql
SELECT * FROM get_trip_expenses_by_category('trip-uuid-here');
```

---

## 如何应用迁移

### 方法 1: Supabase Dashboard（推荐）

1. 登录 [Supabase Dashboard](https://app.supabase.com/)
2. 选择您的项目
3. 进入 **SQL Editor**
4. 复制 `migrations/20250105000000_initial_schema.sql` 内容
5. 粘贴并执行 **Run**

### 方法 2: Supabase CLI

```bash
# 安装 Supabase CLI
npm install -g supabase

# 登录
supabase login

# 链接项目
supabase link --project-ref your-project-ref

# 应用迁移
supabase db push
```

### 方法 3: 使用后端 API（未来功能）

我们将在后端实现一个迁移管理系统。

---

## 验证迁移成功

执行迁移后，检查以下内容：

1. **检查表是否创建：**
```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public';
```

应该看到：`profiles`, `trip_preferences`, `trips`, `expenses`

2. **检查 RLS 是否启用：**
```sql
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public';
```

所有表的 `rowsecurity` 应该是 `true`

3. **测试插入数据（需要先登录）：**
```sql
-- 插入测试 profile
INSERT INTO profiles (id, username, full_name)
VALUES (auth.uid(), 'testuser', 'Test User');
```

---

## 环境变量配置

更新 `backend/.env` 文件：

```env
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

获取这些值：
1. Supabase Dashboard → Project Settings → API
2. 复制 **URL** 和 **anon public** key
3. 复制 **service_role** key（⚠️ 保密！仅用于服务端）

---

## 数据库索引

已创建以下索引以优化查询性能：

- `profiles_username_idx` - 用户名查询
- `trip_preferences_user_id_idx` - 用户偏好查询
- `trips_user_id_idx` - 用户旅行计划查询
- `trips_start_date_idx` - 日期范围查询
- `trips_status_idx` - 状态筛选
- `expenses_trip_id_idx` - 旅行花费查询
- `expenses_user_id_idx` - 用户花费查询
- `expenses_expense_date_idx` - 日期查询
- `expenses_category_idx` - 类别统计

---

## 安全注意事项

1. **永远不要在客户端使用 service_role key**
2. **RLS 策略已强制执行** - 用户只能访问自己的数据
3. **JWT 验证** - 所有查询都需要有效的 Supabase JWT token
4. **输入验证** - 使用 CHECK 约束防止无效数据

---

## 下一步

- [ ] 应用数据库迁移
- [ ] 配置后端 Supabase 客户端
- [ ] 编写数据库集成测试
- [ ] 实现 API 端点（CRUD 操作）

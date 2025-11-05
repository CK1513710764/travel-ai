# Supabase 设置指南

本指南将帮助您完成 Supabase 项目的创建和数据库迁移。

## 前置要求

- 拥有 GitHub 账号（用于 Supabase 登录）
- 基本的 SQL 知识（可选）

---

## 步骤 1: 创建 Supabase 项目

### 1.1 注册/登录 Supabase

访问 [Supabase](https://supabase.com/) 并使用 GitHub 账号登录。

### 1.2 创建新项目

1. 点击 **New Project**
2. 选择组织（Organization）或创建新组织
3. 填写项目信息：
   - **Project Name**: `travel-ai` 或您喜欢的名称
   - **Database Password**: 设置一个强密码（⚠️ 请妥善保存）
   - **Region**: 选择 `Northeast Asia (Tokyo)` 或 `Southeast Asia (Singapore)`（离中国较近）
4. 点击 **Create new project**
5. 等待项目初始化（约 2-3 分钟）

---

## 步骤 2: 获取 API 凭据

项目创建完成后：

1. 进入 **Project Settings** (左下角齿轮图标)
2. 选择 **API** 标签页
3. 复制以下信息：

```
Project URL: https://xxxxx.supabase.co
anon public key: eyJhbG...
service_role key: eyJhbG... (点击 "Reveal" 显示)
```

### 更新后端环境变量

编辑 `backend/.env` 文件：

```env
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbG...（复制 anon public key）
SUPABASE_SERVICE_ROLE_KEY=eyJhbG...（复制 service_role key）
```

⚠️ **重要安全提示：**
- `anon key`: 可在前端使用，受 RLS 保护
- `service_role key`: 仅在后端使用，绕过 RLS，拥有完全访问权限

---

## 步骤 3: 应用数据库迁移

### 方法 1: 使用 Supabase Dashboard（推荐，最简单）

1. 在 Supabase Dashboard 左侧菜单选择 **SQL Editor**
2. 点击 **New Query**
3. 打开项目文件 `backend/supabase/migrations/20250105000000_initial_schema.sql`
4. 复制整个文件内容
5. 粘贴到 SQL Editor
6. 点击右下角 **Run** 按钮
7. 等待执行完成（应该看到 "Success. No rows returned"）

### 方法 2: 使用 Supabase CLI

如果您更喜欢命令行：

```bash
# 1. 安装 Supabase CLI
npm install -g supabase

# 2. 登录
supabase login

# 3. 链接项目（在项目根目录）
supabase link --project-ref <your-project-ref>
# project-ref 在 Project Settings → General 中找到

# 4. 推送迁移
supabase db push
```

---

## 步骤 4: 验证迁移成功

### 4.1 检查表是否创建

在 Supabase Dashboard:

1. 选择 **Table Editor**（左侧菜单）
2. 应该看到以下表：
   - ✅ `profiles`
   - ✅ `trip_preferences`
   - ✅ `trips`
   - ✅ `expenses`

### 4.2 验证 Row Level Security

在 **SQL Editor** 执行：

```sql
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public';
```

所有表的 `rowsecurity` 列应该是 `true`。

### 4.3 测试数据库函数

```sql
-- 测试 get_trip_total_expenses 函数
SELECT get_trip_total_expenses('00000000-0000-0000-0000-000000000000');
-- 应该返回: 0
```

---

## 步骤 5: 配置认证设置

### 5.1 启用 Email 认证

1. 进入 **Authentication** → **Providers**
2. 确保 **Email** 已启用
3. 配置 Email 模板（可选）：
   - 进入 **Email Templates**
   - 自定义 "Confirm your signup" 等邮件模板

### 5.2 配置重定向 URL（开发环境）

进入 **Authentication** → **URL Configuration**:

```
Site URL: http://localhost:5173
Redirect URLs:
  - http://localhost:5173/auth/callback
  - http://localhost:5000/auth/callback
```

---

## 步骤 6: 测试后端连接

### 6.1 运行健康检查

```bash
cd backend
npm run dev
```

访问 `http://localhost:5000/health`，应该看到：

```json
{
  "status": "ok",
  "timestamp": "2025-01-05T...",
  "service": "travel-ai-backend"
}
```

### 6.2 运行数据库集成测试

```bash
cd backend
npm test -- database.integration.test.ts
```

如果配置正确，应该看到测试通过。

---

## 常见问题

### Q1: 迁移执行失败，报错 "permission denied"

**解决方案：** 确保您使用的是 `service_role` key 或者在 Dashboard 中执行（Dashboard 自动使用管理员权限）。

### Q2: RLS 策略导致无法插入数据

**解决方案：** RLS 是设计行为。在测试时：
- 使用 `supabaseAdmin` 客户端（绕过 RLS）
- 或者先通过 `supabase.auth.signUp()` 创建用户并登录

### Q3: 如何回滚迁移？

Supabase 没有内置回滚功能。如需回滚：

1. 在 SQL Editor 执行：
```sql
DROP TABLE IF EXISTS expenses CASCADE;
DROP TABLE IF EXISTS trips CASCADE;
DROP TABLE IF EXISTS trip_preferences CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

DROP FUNCTION IF EXISTS get_trip_total_expenses(UUID);
DROP FUNCTION IF EXISTS get_trip_expenses_by_category(UUID);
DROP FUNCTION IF EXISTS update_updated_at_column();
```

2. 重新运行迁移脚本

### Q4: 数据库连接超时

检查：
- 网络连接是否正常
- `SUPABASE_URL` 是否正确
- Supabase 项目状态是否为 "Active"（Dashboard 右上角）

---

## 数据库备份

Supabase 自动备份您的数据库（保留 7 天），但建议：

### 手动备份

```bash
# 使用 Supabase CLI
supabase db dump -f backup.sql

# 或在 Dashboard: Database → Backups
```

---

## 下一步

✅ 数据库设置完成后，您可以：

1. 实现用户认证 API
2. 创建 CRUD 端点（trips, expenses）
3. 集成 AI 服务生成行程
4. 开发前端界面

详见项目文档 `docs/API_DOCUMENTATION.md`

---

## 有用的 SQL 查询

### 查看所有表结构
```sql
SELECT
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
ORDER BY table_name, ordinal_position;
```

### 查看所有 RLS 策略
```sql
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public';
```

### 查看所有索引
```sql
SELECT
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public';
```

---

## 支持

如遇问题：
- 查看 [Supabase 文档](https://supabase.com/docs)
- 访问 [Supabase Discord](https://discord.supabase.com/)
- 检查项目 GitHub Issues

# Travel AI - 智能旅行规划系统

基于 AI 的智能旅行规划 Web 应用，支持语音输入、个性化行程生成、地图可视化和预算管理。

**GitHub 仓库**: https://github.com/CK1513710764/travel-ai

---

## 目录

- [功能特性](#功能特性)
- [技术栈](#技术栈)
- [快速开始](#快速开始)
- [Docker 部署说明](#docker-部署说明)
- [使用说明](#使用说明)
- [项目结构](#项目结构)
- [常见问题](#常见问题)

---

## 功能特性

### 核心功能

- ✅ **语音输入**: 支持语音和文本两种输入方式，使用 Web Speech API 实现语音识别
- ✅ **AI 行程生成**: 基于阿里云百炼（通义千问）生成个性化旅行行程
- ✅ **地图可视化**: 使用 Leaflet + OpenStreetMap 展示行程路线和景点标记
- ✅ **用户认证**: 基于 Supabase 的安全认证系统
- ✅ **旅行偏好**: 支持自定义旅行偏好（美食、动漫、历史等）
- ✅ **行程编辑**: 支持编辑旅行信息并重新生成行程
- ✅ **预算管理**: 预算追踪、消费记录、分类统计、预算对比图表

### 技术亮点

- 🐳 **Docker 一键部署**: 通过 Docker Compose 实现一键启动
- 🎯 **多模态输入**: 语音 + 文本输入，AI 智能解析用户意图
- 🗺️ **路线可视化**: 显示每日行程路线，带方向箭头指示
- 📍 **坐标生成**: AI 直接生成景点 GPS 坐标，支持全球范围
- 🔒 **安全设计**: 所有 API Key 通过环境变量管理，不在代码中硬编码

---

## 技术栈

### 前端
- **React 18** + **TypeScript**: 现代化 UI 框架
- **Vite**: 快速开发构建工具
- **Leaflet.js**: 地图组件库，使用 OpenStreetMap 瓦片
- **Web Speech API**: 浏览器原生语音识别

### 后端
- **Node.js** + **Express.js**: 轻量级 API 服务器
- **TypeScript**: 类型安全
- **Supabase**: PostgreSQL 数据库 + 用户认证
- **阿里云百炼**: 通义千问大模型 API

### 部署
- **Docker** + **Docker Compose**: 容器化部署
- **Nginx**: 前端静态文件服务器
- **Multi-stage Build**: 优化镜像大小

---

## 快速开始

### 前置要求

在开始之前，请确保您的系统已安装：

1. **Docker Desktop**（必需）
   - Windows/Mac: 下载并安装 [Docker Desktop](https://www.docker.com/products/docker-desktop/)
   - Linux: 安装 Docker Engine + Docker Compose
   - **重要**: 启动 Docker Desktop 并确保其正在运行（系统托盘图标不再转动）

2. **Git**（必需）
   - 用于克隆项目代码

---

### 第一步：克隆项目

打开终端（Windows 用户使用 Git Bash），执行：

```bash
git clone https://github.com/CK1513710764/travel-ai.git
cd travel-ai
```

---

### 第二步：配置 API Keys（重要！）

本项目需要以下 API Keys 才能正常运行。

#### 2.1 复制环境变量模板

在项目根目录下执行：

```bash
# Windows (Git Bash) 或 Linux/Mac
cp .env.example .env
```

执行后会在项目根目录创建 `.env` 文件。

#### 2.2 获取必需的 API Keys

**① Supabase 配置**（数据库和认证服务）

1. 访问 [supabase.com](https://supabase.com) 并登录（或注册新账号）
2. 点击 `New Project` 创建新项目
   - Organization: 选择或创建一个组织
   - Name: 任意名称（如 `travel-ai`）
   - Database Password: 设置一个强密码（请记住）
   - Region: 选择 `Northeast Asia (Tokyo)` 或其他靠近的区域
3. 点击 `Create new project`，等待项目初始化完成（约 2-3 分钟）
4. 项目创建完成后，进入项目设置：
   - 左侧边栏点击 `Settings` → `API`
5. 复制以下三个值：
   - **Project URL** → 复制到 `.env` 文件的 `SUPABASE_URL`
   - **anon/public key** → 复制到 `.env` 文件的 `SUPABASE_ANON_KEY`
   - **service_role key** → 点击眼睛图标显示，复制到 `.env` 文件的 `SUPABASE_SERVICE_ROLE_KEY`

**② 阿里云百炼 API Key**（AI 服务）

1. 访问 [阿里云百炼平台](https://dashscope.aliyun.com)
2. 使用阿里云账号登录（没有账号则需要注册）
3. 首次使用需要：
   - 实名认证（上传身份证照片）
   - 开通百炼服务（免费试用）
4. 进入控制台，点击右上角头像 → `API-KEY 管理`
5. 点击 `创建新的 API-KEY`
6. 复制生成的 API Key → 填入 `.env` 文件的 `DASHSCOPE_API_KEY`

> **注意**：助教批改作业时会使用助教的 API Key，但您在开发测试时需要使用自己的 Key。

#### 2.3 编辑 .env 文件

使用任意文本编辑器（记事本、VS Code、Sublime 等）打开项目根目录下的 `.env` 文件，填入刚才获取的 API Keys：

```env
# Supabase 配置 (必需)
SUPABASE_URL=https://你的项目ID.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# 阿里云百炼 API Key (必需)
DASHSCOPE_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxx

# 可选配置（不填也能运行）
ALIYUN_API_KEY=你的阿里云密钥
AMAP_API_KEY=你的高德地图密钥

# 运行环境（不用修改）
NODE_ENV=production
PORT=5000
```

**示例（已脱敏）**:
```env
SUPABASE_URL=https://abc123def456.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS...
DASHSCOPE_API_KEY=sk-1a2b3c4d5e6f7g8h9i0j
```

> **安全提示**：`.env` 文件包含敏感信息，已被 `.gitignore` 忽略，不会被提交到 Git 仓库。

---

### 第三步：启动应用

确保 Docker Desktop 正在运行，然后选择以下任一方法启动：

#### 方法一：使用一键启动脚本（推荐）

**Windows 用户（Git Bash）**:

```bash
bash start.sh
```

**Linux/Mac 用户**:

```bash
chmod +x start.sh
./start.sh
```

脚本会自动完成以下操作：
1. 检查 `.env` 文件是否存在
2. 构建 Docker 镜像（首次运行需要几分钟）
3. 启动前后端容器
4. 显示访问地址

#### 方法二：直接使用 Docker Compose

```bash
# 前台运行（推荐首次使用，可以看到日志）
docker-compose up --build

# 后台运行（适合日常使用）
docker-compose up --build -d
```

#### 启动过程说明

**首次启动**需要下载依赖和构建镜像，大约需要 **5-10 分钟**，请耐心等待。

您会看到类似的输出：

```
[+] Building 120.5s
 => [backend] downloading dependencies...
 => [frontend] building application...

✓ Container travel-ai-backend   Started
✓ Container travel-ai-frontend  Started

travel-ai-backend   | 🚀 Server is running on port 5000
travel-ai-backend   | 📍 Environment: production
travel-ai-frontend  | /docker-entrypoint.sh: Configuration complete; ready for start up
travel-ai-frontend  | 2025/01/07 07:42:15 [notice] 1#1: start worker processes
```

看到上述信息表示**启动成功**！

---

### 第四步：访问应用

启动成功后，打开浏览器访问：

- **前端应用**: http://localhost:8080
- **后端 API**: http://localhost:5000

#### 首次使用指南

1. 在浏览器中打开 http://localhost:8080
2. 点击页面右上角的 **"注册"** 按钮
3. 填写邮箱和密码：
   - 邮箱：任意有效邮箱（Supabase 会发送验证邮件）
   - 密码：至少 6 位字符
4. 点击 **"注册"** 按钮
5. 检查邮箱，点击 Supabase 发送的验证链接
6. 返回应用，使用刚才的邮箱和密码**登录**
7. 登录成功后，点击 **"新建旅行"** 开始创建您的第一个旅行计划！

---

### 停止应用

当您不再使用应用时，可以停止容器：

```bash
# 停止并删除容器（保留数据）
docker-compose down

# 停止并删除容器及所有数据卷（清空所有数据）
docker-compose down -v
```

---

### 常用 Docker 命令

```bash
# 查看正在运行的容器
docker ps

# 查看所有容器（包括已停止的）
docker ps -a

# 查看实时日志
docker-compose logs -f

# 只看后端日志
docker-compose logs -f backend

# 只看前端日志
docker-compose logs -f frontend

# 重启服务（不重新构建）
docker-compose restart

# 重新构建镜像
docker-compose build

# 清理未使用的 Docker 资源（释放磁盘空间）
docker system prune -a
```

---

## Docker 部署说明

本项目完全支持 Docker 容器化部署，满足一键启动要求。

### Docker 镜像构建

前端和后端都使用 Multi-stage Build 优化镜像大小：

- **前端**: Node.js 构建 + Nginx 服务，最终镜像约 50MB
- **后端**: Node.js 生产环境，使用非 root 用户运行，最终镜像约 200MB

### 健康检查

- **后端**: 每 30 秒检查 `/health` 端点
- **前端**: 每 30 秒检查 Nginx 状态
- 容器启动失败会自动重启（restart: unless-stopped）

### 端口说明

- **前端**: 宿主机端口 `8080` 映射到容器端口 `80`
- **后端**: 宿主机端口 `5000` 映射到容器端口 `5000`

如果端口被占用，可以修改 `docker-compose.yml` 中的端口映射：

```yaml
services:
  frontend:
    ports:
      - "8080:80"  # 改为 "8081:80" 使用 8081 端口
```

---

## 使用说明

### 创建旅行计划

#### 1. 注册/登录账户
- 首次使用需要注册账户
- 支持邮箱注册和登录
- 注册后需要验证邮箱（检查收件箱）

#### 2. 创建新旅行
- 登录后点击 **"新建旅行"** 按钮
- 可以选择 **文本输入** 或 **语音输入**

#### 3. 语音输入示例（推荐）
点击麦克风图标，说出您的旅行需求：

> "我想在12月去日本东京玩5天，预算一万五，两个人去，我喜欢美食和动漫"

AI 会自动解析您的语音，填充表单。

#### 4. 文本输入示例
手动填写表单：
- **目的地**: 东京
- **开始日期**: 2025-12-01
- **结束日期**: 2025-12-05
- **旅行人数**: 2
- **预算**: 15000
- **偏好**: 喜欢美食和动漫

#### 5. 生成 AI 行程
- 填写完信息后，点击 **"生成 AI 行程"** 按钮
- 等待 10-30 秒，AI 将生成详细的每日行程
- 行程包括：
  - 每日活动安排
  - 景点推荐
  - 餐饮建议
  - 住宿推荐
  - 预算估算
  - 旅行小贴士

### 查看和编辑行程

#### 查看地图
- 行程详情页会显示交互式地图
- 地图上标注所有景点位置
- 显示每日行程路线，带方向箭头
- 可以缩放、拖动地图

#### 编辑旅行信息
1. 在旅行详情页点击 **"编辑"** 按钮
2. 修改任意字段（目的地、日期、预算、偏好等）
3. 点击 **"保存修改"**
4. 可以点击 **"重新生成"** 按钮，基于新信息生成新行程

### 费用管理

在旅行详情页下方有 **"费用管理"** 模块：

#### 查看预算概览
- **总预算**: 创建旅行时设置的预算
- **已花费**: 已记录的所有消费总和
- **剩余**: 总预算减去已花费
- **预算使用进度条**: 直观显示预算使用情况

#### 添加消费记录
1. 点击 **"+ 添加消费"** 按钮
2. 填写消费信息：
   - **分类**: 交通、住宿、餐饮、门票、购物、娱乐、其他
   - **金额**: 消费金额（单位：元）
   - **日期**: 消费日期
   - **说明**: 可选，如"午餐"、"地铁票"
3. 点击 **"添加"** 按钮

#### 查看和删除消费
- 消费记录按日期倒序排列
- 点击记录右侧的 **×** 按钮可以删除
- 分类统计会自动更新

---

## 项目结构

```
travel-ai/
├── frontend/                       # React 前端应用
│   ├── src/
│   │   ├── components/             # React 组件
│   │   │   ├── MapView.tsx         # 地图组件（Leaflet）
│   │   │   ├── VoiceInput.tsx      # 语音输入组件
│   │   │   └── ExpenseManager.tsx  # 费用管理组件
│   │   ├── pages/                  # 页面组件
│   │   │   ├── TripDetail.tsx      # 旅行详情页
│   │   │   ├── CreateTrip.tsx      # 创建旅行页
│   │   │   └── TripsList.tsx       # 旅行列表页
│   │   ├── services/               # API 客户端
│   │   │   └── api.ts              # Axios 封装
│   │   ├── hooks/                  # 自定义 Hooks
│   │   │   └── useSpeechRecognition.ts
│   │   ├── types/                  # TypeScript 类型定义
│   │   │   └── index.ts
│   │   └── App.tsx                 # 应用根组件
│   ├── Dockerfile                  # 前端 Docker 镜像
│   ├── nginx.conf                  # Nginx 配置
│   └── package.json
├── backend/                        # Node.js 后端 API
│   ├── src/
│   │   ├── routes/                 # API 路由
│   │   │   ├── auth.ts
│   │   │   ├── trips.ts
│   │   │   └── expenses.ts
│   │   ├── controllers/            # 业务逻辑
│   │   │   ├── trips.controller.ts
│   │   │   └── expenses.controller.ts
│   │   ├── services/               # 外部服务集成
│   │   │   └── ai.service.ts       # AI 服务（百炼 API）
│   │   ├── middleware/             # 中间件
│   │   │   ├── auth.ts
│   │   │   └── validation.ts
│   │   └── server.ts               # 服务器入口
│   ├── Dockerfile                  # 后端 Docker 镜像
│   ├── supabase/
│   │   └── migrations/             # 数据库迁移文件
│   │       └── 20250107000000_add_preferences_to_trips.sql
│   └── package.json
├── docker-compose.yml              # Docker Compose 配置
├── start.sh                        # 一键启动脚本
├── .env.example                    # 环境变量模板
├── .gitignore                      # Git 忽略文件
├── CLAUDE.md                       # 项目指导文档
└── README.md                       # 本文件
```

---

## 常见问题

### 1. Docker Desktop 未启动

**问题**: 执行 `docker-compose up` 时报错：
```
Cannot connect to the Docker daemon
```

**解决**:
1. 启动 Docker Desktop 应用
2. 等待 Docker 完全启动（系统托盘图标不再转动）
3. 在终端执行 `docker --version` 确认 Docker 可用
4. 重新执行启动命令

---

### 2. 端口被占用

**问题**: 启动时提示端口被占用：
```
Bind for 0.0.0.0:8080 failed: port is already allocated
```

**解决**:

**方法一：停止占用端口的程序**
```bash
# Windows 查看端口占用
netstat -ano | findstr :8080

# 根据 PID 结束进程（需要管理员权限）
taskkill /PID 进程ID /F
```

**方法二：修改端口映射**

编辑 `docker-compose.yml`，修改 frontend 的端口：
```yaml
services:
  frontend:
    ports:
      - "8081:80"  # 改为 8081 或其他未被占用的端口
```

然后访问 http://localhost:8081

---

### 3. API Key 未设置或错误

**问题**: 应用无法生成行程，或显示认证错误

**解决**:
1. 检查 `.env` 文件是否存在于项目根目录
2. 确认所有必需的 API Keys 都已正确填写
3. 验证 API Keys 格式：
   - Supabase URL 应以 `https://` 开头，以 `.supabase.co` 结尾
   - Supabase Keys 应是长字符串（约 300+ 字符）
   - DashScope API Key 应以 `sk-` 开头
4. 重启 Docker 容器使配置生效：
   ```bash
   docker-compose down
   docker-compose up
   ```

---

### 4. 数据库连接失败

**问题**: 无法连接到 Supabase，或提示数据库错误

**解决**:
1. 登录 [supabase.com](https://supabase.com) 确认项目状态为 "Active"
2. 检查 Supabase 项目是否暂停（免费版项目 7 天不活跃会暂停）
3. 如果项目暂停，点击 "Restore project" 恢复
4. 检查网络连接，确保可以访问 Supabase 服务器
5. 确认 `SUPABASE_URL` 和 `SUPABASE_ANON_KEY` 正确

---

### 5. 语音输入不工作

**问题**: 点击麦克风没有反应，或浏览器不请求麦克风权限

**解决**:
1. **浏览器兼容性**: 语音识别目前仅支持以下浏览器：
   - Chrome / Edge / Brave（推荐）
   - Safari（Mac）
   - 不支持 Firefox
2. **权限设置**:
   - 浏览器应弹出麦克风权限请求，点击 "允许"
   - 如果没有弹出，检查浏览器设置 → 隐私和安全 → 网站设置 → 麦克风
   - 确保 `localhost` 有麦克风访问权限
3. **HTTPS 要求**:
   - `localhost` 可以使用语音识别
   - 如果部署到服务器，必须使用 HTTPS

---

### 6. 地图显示空白

**问题**: 行程详情页地图不显示，或显示空白区域

**解决**:
1. 检查网络连接，确保可以访问 OpenStreetMap
2. 打开浏览器开发者工具（F12），查看 Console 是否有错误
3. 常见原因：
   - **网络问题**: OpenStreetMap 服务器可能在国内访问较慢，请耐心等待
   - **坐标错误**: 确保 AI 生成的行程包含有效的 GPS 坐标
   - **浏览器缓存**: 清除浏览器缓存并刷新页面
4. 如果地图始终无法加载，可以尝试使用 VPN

---

### 7. Docker 构建速度慢

**问题**: 首次执行 `docker-compose up --build` 需要很长时间

**原因**: 需要下载 Node.js 镜像、安装依赖包（npm install）

**优化方法**:
1. **使用国内镜像加速**（推荐）:
   - Docker Hub 镜像: 在 Docker Desktop 设置中配置镜像加速器
   - npm 镜像: 在 `package.json` 所在目录执行：
     ```bash
     npm config set registry https://registry.npmmirror.com
     ```
2. **后续构建会更快**: Docker 会缓存已下载的层，后续构建只需 1-2 分钟

---

### 8. 邮箱验证邮件未收到

**问题**: 注册后没有收到 Supabase 的验证邮件

**解决**:
1. 检查垃圾邮件/垃圾箱
2. 等待几分钟（可能有延迟）
3. 在 Supabase 控制台中重新发送验证邮件：
   - 登录 Supabase 控制台
   - 进入项目 → Authentication → Users
   - 找到对应用户，点击 "Send magic link"
4. 或者手动验证：
   - 在 Supabase 控制台 → Authentication → Users
   - 找到对应用户，点击三个点 → "Send confirmation email"

---

## API 接口文档

### 认证接口
- `POST /auth/signup` - 用户注册
- `POST /auth/login` - 用户登录
- `POST /auth/logout` - 用户登出

### 旅行管理
- `POST /api/trips` - 创建旅行
- `GET /api/trips` - 获取用户的旅行列表
- `GET /api/trips/:id` - 获取旅行详情
- `PUT /api/trips/:id` - 更新旅行信息
- `DELETE /api/trips/:id` - 删除旅行
- `POST /api/trips/:id/generate` - 生成 AI 行程

### 预算管理
- `GET /api/trips/:id/budget` - 获取预算摘要
- `POST /api/trips/:id/expenses` - 添加消费记录
- `GET /api/trips/:id/expenses` - 获取消费列表
- `DELETE /api/trips/:id/expenses/:expenseId` - 删除消费记录

### AI 服务
- `POST /api/ai/parse-voice` - 解析语音输入文本

---

## 开发指南

### 本地开发（不使用 Docker）

#### 前端开发
```bash
cd frontend
npm install
npm run dev  # 启动开发服务器 http://localhost:5173
```

#### 后端开发
```bash
cd backend
npm install
npm run dev  # 启动开发服务器 http://localhost:5000
```

### 环境变量（开发环境）

开发时，前端和后端需要分别配置环境变量：

**前端** (`frontend/.env`):
```env
VITE_API_URL=http://localhost:5000
VITE_SUPABASE_URL=你的Supabase_URL
VITE_SUPABASE_ANON_KEY=你的Supabase_Anon_Key
```

**后端** (`backend/.env` 或根目录 `.env`):
```env
SUPABASE_URL=你的Supabase_URL
SUPABASE_ANON_KEY=你的Supabase_Anon_Key
SUPABASE_SERVICE_ROLE_KEY=你的Supabase_Service_Role_Key
DASHSCOPE_API_KEY=你的DashScope_API_Key
PORT=5000
NODE_ENV=development
```

---

## 贡献指南

欢迎提交 Issue 和 Pull Request！

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

---

## 许可证

MIT License

---

## 作者

2025年大模型辅助软件工程课程作业

---

## 致谢

- [阿里云百炼](https://dashscope.aliyun.com) 提供 AI 能力
- [Supabase](https://supabase.com) 提供数据库和认证服务
- [OpenStreetMap](https://www.openstreetmap.org) 提供地图数据
- [Leaflet.js](https://leafletjs.com) 地图组件库
- [Claude](https://claude.ai) AI 辅助开发

---

**如有问题，欢迎提交 [Issue](https://github.com/CK1513710764/travel-ai/issues)**

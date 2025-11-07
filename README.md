# Travel AI - 智能旅行规划系统

基于 AI 的智能旅行规划 Web 应用，支持语音输入、个性化行程生成、地图可视化和预算管理。

## 功能特性

### 核心功能
- ✅ **语音输入**: 支持语音和文本两种输入方式，使用 Web Speech API 实现语音识别
- ✅ **AI 行程生成**: 基于阿里云百炼（通义千问）生成个性化旅行行程
- ✅ **地图可视化**: 使用 Leaflet + OpenStreetMap 展示行程路线和景点标记
- ✅ **用户认证**: 基于 Supabase 的安全认证系统
- ✅ **旅行偏好**: 支持自定义旅行偏好（美食、动漫、历史等）
- ✅ **行程编辑**: 支持编辑旅行信息并重新生成行程
- ⚠️ **预算管理**: 后端 API 已实现，前端 UI 待开发

### 技术亮点
- 🐳 **Docker 一键部署**: 通过 Docker Compose 实现一键启动
- 🎯 **多模态输入**: 语音 + 文本输入，AI 智能解析用户意图
- 🗺️ **路线可视化**: 显示每日行程路线，带方向箭头指示
- 📍 **坐标生成**: AI 直接生成景点 GPS 坐标，支持全球范围
- 🔒 **安全设计**: 所有 API Key 通过环境变量管理，不在代码中硬编码

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

## 快速开始

### 环境要求
- Docker Desktop (Windows/Mac) 或 Docker Engine (Linux)
- Git

### 1. 克隆项目
\`\`\`bash
git clone https://github.com/你的用户名/travel-ai.git
cd travel-ai
\`\`\`

### 2. 配置环境变量

复制环境变量模板文件：
\`\`\`bash
cp .env.example .env
\`\`\`

编辑 \`.env\` 文件，填入您的 API Keys：
\`\`\`env
# Supabase 配置 (必需)
SUPABASE_URL=https://你的项目ID.supabase.co
SUPABASE_ANON_KEY=你的匿名密钥
SUPABASE_SERVICE_ROLE_KEY=你的服务端密钥

# 阿里云百炼 API Key (必需)
DASHSCOPE_API_KEY=你的阿里云API密钥

# 可选配置
ALIYUN_API_KEY=你的阿里云密钥
AMAP_API_KEY=你的高德地图密钥

# 运行环境
NODE_ENV=production
PORT=5000
\`\`\`

**获取 API Keys：**
- **Supabase**: 访问 [supabase.com](https://supabase.com)，创建项目后在设置中获取
- **阿里云百炼**: 访问 [dashscope.aliyun.com](https://dashscope.aliyun.com)，开通服务后获取 API Key

### 3. 启动应用

#### Windows:
\`\`\`bash
bash start.sh
\`\`\`

#### Linux/Mac:
\`\`\`bash
chmod +x start.sh
./start.sh
\`\`\`

或者直接使用 Docker Compose:
\`\`\`bash
docker-compose up --build
\`\`\`

### 4. 访问应用

启动成功后，在浏览器中访问：
- **前端应用**: http://localhost:8080
- **后端 API**: http://localhost:5000

**注意**: 如果端口 8080 被占用，可以在 \`docker-compose.yml\` 中修改 frontend 服务的端口映射。

## Docker 部署说明

本项目完全支持 Docker 容器化部署，满足一键启动要求：

### Docker 镜像构建
前端和后端都使用 Multi-stage Build 优化镜像大小：
- **前端**: Node.js 构建 + Nginx 服务，最终镜像约 50MB
- **后端**: Node.js 生产环境，使用非 root 用户运行，最终镜像约 200MB

### 健康检查
- 后端：每30秒检查 `/health` 端点
- 前端：每30秒检查 Nginx 状态
- 容器启动失败会自动重启

### 查看运行状态
\`\`\`bash
docker ps                        # 查看容器状态
docker-compose logs -f           # 查看所有日志
docker-compose logs -f backend   # 只看后端日志
\`\`\`

### 停止服务
\`\`\`bash
docker-compose down              # 停止并删除容器
docker-compose down -v           # 同时删除数据卷
\`\`\`

## 使用说明

### 创建旅行计划

1. **注册/登录账户**
   - 首次使用需要注册账户
   - 支持邮箱注册和登录

2. **创建新旅行**
   - 点击"新建旅行"按钮
   - 可以选择**文本输入**或**语音输入**

3. **语音输入示例**
   > "我想在12月去日本东京玩5天，预算一万五，两个人去，我喜欢美食和动漫"

4. **文本输入**
   - 目的地：东京
   - 开始日期：2025-12-01
   - 结束日期：2025-12-05
   - 旅行人数：2
   - 预算：15000
   - 偏好：喜欢美食和动漫

5. **生成 AI 行程**
   - 填写完信息后，点击"生成 AI 行程"
   - AI 将根据您的信息生成详细的每日行程

### 编辑旅行信息

1. 在旅行详情页点击"编辑"按钮
2. 修改旅行信息（目的地、日期、偏好等）
3. 保存后可重新生成行程

### 查看地图

- 行程详情页会显示交互式地图
- 地图上标注所有景点位置
- 显示每日行程路线，带方向箭头

## 项目结构

\`\`\`
travel-ai/
├── frontend/                 # React 前端应用
│   ├── src/
│   │   ├── components/       # React 组件
│   │   │   ├── MapView.tsx   # 地图组件
│   │   │   └── VoiceInput.tsx # 语音输入组件
│   │   ├── pages/            # 页面组件
│   │   │   ├── TripDetail.tsx # 旅行详情页
│   │   │   └── CreateTrip.tsx # 创建旅行页
│   │   ├── services/         # API 客户端
│   │   ├── hooks/            # 自定义 Hooks
│   │   └── types/            # TypeScript 类型定义
│   ├── Dockerfile            # 前端 Docker 镜像
│   └── nginx.conf            # Nginx 配置
├── backend/                  # Node.js 后端 API
│   ├── src/
│   │   ├── routes/           # API 路由
│   │   ├── controllers/      # 业务逻辑
│   │   ├── services/         # 外部服务集成
│   │   │   └── ai.service.ts # AI 服务（百炼 API）
│   │   └── middleware/       # 中间件
│   ├── Dockerfile            # 后端 Docker 镜像
│   └── supabase/
│       └── migrations/       # 数据库迁移文件
├── docker-compose.yml        # Docker Compose 配置
├── start.sh                  # 一键启动脚本
├── .env.example              # 环境变量模板
└── README.md                 # 本文件
\`\`\`

## 常见问题

### 1. 端口冲突
**问题**: 启动时提示端口被占用
**解决**:
- 检查端口 5000 和 8080 是否被其他程序占用
- 修改 \`docker-compose.yml\` 中的端口映射
- Windows 用户可能需要停止 IIS 或其他 Web 服务器

### 2. API Key 未设置
**问题**: 应用无法生成行程
**解决**:
- 确保 \`.env\` 文件存在且包含所有必需的 API Keys
- 重启 Docker 容器: \`docker-compose restart\`

### 3. 数据库连接失败
**问题**: 无法连接到 Supabase
**解决**:
- 检查 \`SUPABASE_URL\` 和 \`SUPABASE_ANON_KEY\` 是否正确
- 确保 Supabase 项目处于活跃状态
- 检查网络连接

### 4. 语音输入不工作
**问题**: 点击麦克风没有反应
**解决**:
- 确保使用 HTTPS 或 localhost（浏览器安全要求）
- 检查浏览器麦克风权限
- 目前仅支持 Chrome、Edge 等基于 Chromium 的浏览器

### 5. 地图显示空白
**问题**: 行程详情页地图不显示
**解决**:
- 检查网络连接（需要访问 OpenStreetMap）
- 查看浏览器控制台是否有错误
- 确保 AI 生成的行程包含坐标信息

## 待完成功能

根据作业要求，以下功能待实现：

1. **API Key 管理 UI** (高优先级 - 安全要求)
   - 前端设置页面，允许用户配置 API Keys
   - 避免在代码中硬编码密钥

2. **预算追踪前端** (中优先级)
   - 后端 API 已完成
   - 需要实现前端 UI 组件
   - 消费记录的增删改查
   - 预算vs实际支出对比图表

## 许可证

MIT License

## 作者

2025年大模型辅助软件工程课程作业

## 致谢

- 阿里云百炼提供 AI 能力
- Supabase 提供数据库和认证服务
- OpenStreetMap 提供地图数据
- Leaflet.js 地图组件库

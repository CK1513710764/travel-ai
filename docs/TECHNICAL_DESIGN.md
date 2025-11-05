# 技术设计文档 (Technical Design Document)

## 文档信息

| 项目名称 | AI 旅行规划师 (AI Travel Planner) |
|---------|----------------------------------|
| 文档版本 | v1.0 |
| 创建日期 | 2025-11-04 |
| 技术负责人 | - |

---

## 目录

1. [系统架构设计](#1-系统架构设计)
2. [技术栈选型](#2-技术栈选型)
3. [前端架构设计](#3-前端架构设计)
4. [后端架构设计](#4-后端架构设计)
5. [数据库设计](#5-数据库设计)
6. [API 设计](#6-api-设计)
7. [第三方服务集成](#7-第三方服务集成)
8. [安全设计](#8-安全设计)
9. [性能优化方案](#9-性能优化方案)
10. [部署架构](#10-部署架构)
11. [开发规范](#11-开发规范)
12. [测试策略](#12-测试策略)

---

## 1. 系统架构设计

### 1.1 整体架构

```
┌───────────────────────────────────────────────────────┐
│                      客户端层                          │
│  ┌─────────────────────────────────────────────┐      │
│  │         React SPA (Single Page App)         │      │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  │      │
│  │  │  Pages   │  │ Component│  │  Hooks   │  │      │
│  │  └──────────┘  └──────────┘  └──────────┘  │      │
│  │  ┌──────────────────────────────────────┐  │      │
│  │  │        State Management (Zustand)    │  │      │
│  │  └──────────────────────────────────────┘  │      │
│  │  ┌──────────────────────────────────────┐  │      │
│  │  │        API Client (Axios)            │  │      │
│  │  └──────────────────────────────────────┘  │      │
│  └─────────────────────────────────────────────┘      │
└───────────────────────┬───────────────────────────────┘
                        │ HTTPS / WebSocket
                        │ REST API + JSON
┌───────────────────────▼───────────────────────────────┐
│                     API 网关层                         │
│  ┌─────────────────────────────────────────────┐      │
│  │           Express.js Server                 │      │
│  │  ┌──────────────────────────────────────┐  │      │
│  │  │     Middleware Stack                 │  │      │
│  │  │  • CORS                              │  │      │
│  │  │  • JWT Auth                          │  │      │
│  │  │  • Request Validation                │  │      │
│  │  │  • Rate Limiting                     │  │      │
│  │  │  • Error Handler                     │  │      │
│  │  │  • Logger                            │  │      │
│  │  └──────────────────────────────────────┘  │      │
│  └─────────────────────────────────────────────┘      │
└───────────────────────┬───────────────────────────────┘
                        │
        ┌───────────────┼───────────────┐
        │               │               │
┌───────▼────────┐ ┌───▼──────────┐ ┌─▼────────────┐
│  Business      │ │  Service     │ │  Controller  │
│  Logic Layer   │ │  Layer       │ │  Layer       │
│                │ │              │ │              │
│  • Trip        │ │ • LLM        │ │ • Routes     │
│  • Budget      │ │ • Map        │ │ • Handlers   │
│  • User        │ │ • Image      │ │ • Validators │
└───────┬────────┘ └───┬──────────┘ └─┬────────────┘
        │              │              │
        └──────────────┼──────────────┘
                       │
        ┌──────────────┼──────────────┐
        │              │              │
┌───────▼────────┐ ┌──▼──────────┐ ┌─▼────────────┐
│   Supabase     │ │  阿里云百炼  │ │  高德地图     │
│                │ │              │ │              │
│  • PostgreSQL  │ │  • LLM API   │ │  • Map API   │
│  • Auth        │ │  • Text Gen  │ │  • POI       │
│  • Storage     │ │              │ │  • Route     │
└────────────────┘ └──────────────┘ └──────────────┘
```

### 1.2 架构特点

| 特点 | 说明 | 优势 |
|------|------|------|
| 前后端分离 | React SPA + Node.js API | 开发解耦，团队可并行工作 |
| RESTful API | 标准的 REST 接口设计 | 易于理解和维护 |
| 微服务思想 | 服务层解耦，独立调用外部 API | 易于测试和替换服务 |
| 容器化部署 | Docker + Docker Compose | 环境一致性，快速部署 |
| 无状态设计 | JWT Token 认证 | 水平扩展性好 |

### 1.3 数据流向

**用户创建行程的完整数据流**:

```
1. 用户输入
   Browser → Web Speech API → 语音转文字
   ↓
2. 前端处理
   React Form → 数据验证 → Zustand Store 更新
   ↓
3. API 请求
   Axios → POST /api/trips → {destination, dates, budget, ...}
   ↓
4. 后端认证
   Express Middleware → JWT 验证 → 提取 user_id
   ↓
5. 业务逻辑处理
   Trip Controller → Trip Service
   ↓
6. 调用 LLM
   Trip Service → 阿里云百炼 API
   Request: {
     prompt: "请为用户规划一个杭州3日游，预算3000元...",
     model: "qwen-max"
   }
   Response: {
     itinerary: "Day1: 上午西湖，中午外婆家..."
   }
   ↓
7. 地理信息增强
   Trip Service → 高德地图 API
   • 搜索景点 POI，获取坐标
   • 计算路线规划
   ↓
8. 数据持久化
   Trip Service → Supabase Client
   INSERT INTO trips (user_id, destination, itinerary, ...)
   ↓
9. 返回响应
   Express → JSON Response → {trip_id, itinerary, map_data}
   ↓
10. 前端渲染
    React → 更新 State → 渲染行程列表 + 地图
```

---

## 2. 技术栈选型

### 2.1 前端技术栈

| 技术 | 版本 | 选型理由 | 替代方案 |
|------|------|---------|---------|
| **React** | 18+ | 生态成熟，组件化，虚拟DOM性能好 | Vue 3, Svelte |
| **Vite** | 5+ | 构建速度极快，HMR 毫秒级 | Create React App, Webpack |
| **TypeScript** | 5+ | 类型安全，IDE 支持好，减少运行时错误 | JavaScript |
| **Zustand** | 4+ | 轻量级状态管理，API 简洁 | Redux Toolkit, Jotai |
| **React Router** | 6+ | 官方路由库，功能完善 | TanStack Router |
| **Ant Design** | 5+ | 企业级 UI 库，组件丰富，中文文档 | Material-UI, Chakra UI |
| **Axios** | 1.6+ | 拦截器支持，取消请求，错误处理完善 | Fetch API, ky |
| **Recharts** | 2+ | React 原生图表库，声明式 API | Chart.js, ECharts |
| **高德地图 JS API** | 2.0 | 国内数据准确，文档详细 | 百度地图, Mapbox |
| **Web Speech API** | Native | 浏览器原生，无需额外 API Key | 讯飞语音, Azure Speech |

### 2.2 后端技术栈

| 技术 | 版本 | 选型理由 | 替代方案 |
|------|------|---------|---------|
| **Node.js** | 18 LTS | 与前端统一语言，异步性能好 | Python (FastAPI), Go |
| **Express** | 4+ | 轻量灵活，中间件生态丰富 | Koa, Fastify, NestJS |
| **TypeScript** | 5+ | 类型安全，与前端共享类型定义 | JavaScript |
| **Supabase Client** | 2+ | 官方 SDK，封装完善 | 原生 pg 库 |
| **Winston** | 3+ | 企业级日志库，支持多种传输 | Pino, Bunyan |
| **Joi / Zod** | Latest | 强大的数据验证库 | Yup, class-validator |
| **dotenv** | 16+ | 环境变量管理 | - |

### 2.3 数据库与服务

| 服务 | 用途 | 选型理由 |
|------|------|---------|
| **Supabase** | 数据库 + 认证 + 存储 | 一体化 BaaS，开发效率高，自带 Row Level Security |
| **PostgreSQL** | 关系型数据库 (由 Supabase 提供) | 成熟稳定，支持 JSON，扩展性强 |
| **阿里云百炼** | LLM API | 助教有 Key，免去申请流程 |
| **高德地图 API** | 地图服务 | 国内数据精准，Web SDK 完善 |

### 2.4 开发工具

| 工具 | 用途 |
|------|------|
| **VS Code** | IDE |
| **ESLint** | 代码质量检查 |
| **Prettier** | 代码格式化 |
| **Git** | 版本控制 |
| **Docker** | 容器化 |
| **Docker Compose** | 多容器编排 |
| **Postman / Insomnia** | API 测试 |

---

## 3. 前端架构设计

### 3.1 目录结构

```
frontend/
├── public/                  # 静态资源
│   ├── favicon.ico
│   └── logo.png
├── src/
│   ├── api/                # API 客户端
│   │   ├── client.ts       # Axios 实例配置
│   │   ├── trips.ts        # 行程相关 API
│   │   ├── auth.ts         # 认证相关 API
│   │   └── budget.ts       # 预算相关 API
│   ├── components/         # 通用组件
│   │   ├── common/         # 基础组件
│   │   │   ├── Button/
│   │   │   ├── Input/
│   │   │   ├── Card/
│   │   │   └── Loading/
│   │   ├── layout/         # 布局组件
│   │   │   ├── Header/
│   │   │   ├── Footer/
│   │   │   └── Sidebar/
│   │   └── business/       # 业务组件
│   │       ├── TripCard/
│   │       ├── MapView/
│   │       ├── BudgetChart/
│   │       └── VoiceInput/
│   ├── pages/              # 页面组件
│   │   ├── Login/
│   │   ├── Register/
│   │   ├── Dashboard/
│   │   ├── TripNew/
│   │   ├── TripDetail/
│   │   └── Settings/
│   ├── hooks/              # 自定义 Hooks
│   │   ├── useAuth.ts      # 认证逻辑
│   │   ├── useTrip.ts      # 行程逻辑
│   │   ├── useVoice.ts     # 语音输入
│   │   └── useMap.ts       # 地图操作
│   ├── store/              # 全局状态管理
│   │   ├── authStore.ts    # 用户认证状态
│   │   ├── tripStore.ts    # 行程数据
│   │   └── uiStore.ts      # UI 状态
│   ├── types/              # TypeScript 类型定义
│   │   ├── trip.ts
│   │   ├── user.ts
│   │   └── api.ts
│   ├── utils/              # 工具函数
│   │   ├── format.ts       # 格式化工具
│   │   ├── validate.ts     # 验证工具
│   │   └── storage.ts      # 本地存储
│   ├── constants/          # 常量定义
│   │   ├── routes.ts       # 路由常量
│   │   └── config.ts       # 配置常量
│   ├── styles/             # 全局样式
│   │   ├── global.css
│   │   └── variables.css
│   ├── App.tsx             # 根组件
│   ├── main.tsx            # 入口文件
│   └── vite-env.d.ts       # Vite 类型声明
├── .env.example            # 环境变量示例
├── .eslintrc.js            # ESLint 配置
├── .prettierrc             # Prettier 配置
├── tsconfig.json           # TypeScript 配置
├── vite.config.ts          # Vite 配置
├── Dockerfile              # Docker 构建文件
└── package.json
```

### 3.2 状态管理设计 (Zustand)

```typescript
// src/store/authStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  email: string;
  name: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  register: (email: string, password: string, name: string) => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      login: async (email, password) => {
        // API 调用
        const { user, token } = await authAPI.login(email, password);
        set({ user, token, isAuthenticated: true });
      },

      logout: () => {
        set({ user: null, token: null, isAuthenticated: false });
      },

      register: async (email, password, name) => {
        await authAPI.register(email, password, name);
      },
    }),
    {
      name: 'auth-storage', // localStorage key
      partialize: (state) => ({ token: state.token, user: state.user }),
    }
  )
);
```

### 3.3 API 客户端设计

```typescript
// src/api/client.ts
import axios, { AxiosInstance } from 'axios';
import { useAuthStore } from '@/store/authStore';

const apiClient: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器：添加 JWT Token
apiClient.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 响应拦截器：统一错误处理
apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      // Token 过期，跳转到登录页
      useAuthStore.getState().logout();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default apiClient;
```

```typescript
// src/api/trips.ts
import apiClient from './client';
import { Trip, CreateTripDto } from '@/types/trip';

export const tripsAPI = {
  // 创建行程
  create: (data: CreateTripDto): Promise<Trip> => {
    return apiClient.post('/trips', data);
  },

  // 获取行程列表
  list: (): Promise<Trip[]> => {
    return apiClient.get('/trips');
  },

  // 获取行程详情
  get: (id: string): Promise<Trip> => {
    return apiClient.get(`/trips/${id}`);
  },

  // 更新行程
  update: (id: string, data: Partial<Trip>): Promise<Trip> => {
    return apiClient.put(`/trips/${id}`, data);
  },

  // 删除行程
  delete: (id: string): Promise<void> => {
    return apiClient.delete(`/trips/${id}`);
  },

  // 生成行程
  generate: (id: string): Promise<Trip> => {
    return apiClient.post(`/trips/${id}/generate`);
  },
};
```

### 3.4 路由设计

```typescript
// src/App.tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';

// 受保护路由组件
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* 公开路由 */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* 受保护路由 */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/trip/new"
          element={
            <ProtectedRoute>
              <TripNew />
            </ProtectedRoute>
          }
        />
        <Route
          path="/trip/:id"
          element={
            <ProtectedRoute>
              <TripDetail />
            </ProtectedRoute>
          }
        />

        {/* 默认重定向 */}
        <Route path="/" element={<Navigate to="/dashboard" />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}
```

### 3.5 自定义 Hook 示例

```typescript
// src/hooks/useVoice.ts
import { useState, useCallback } from 'react';

interface UseVoiceReturn {
  isListening: boolean;
  transcript: string;
  error: string | null;
  startListening: () => void;
  stopListening: () => void;
}

export const useVoice = (): UseVoiceReturn => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);

  const startListening = useCallback(() => {
    if (!('webkitSpeechRecognition' in window)) {
      setError('浏览器不支持语音识别');
      return;
    }

    const recognition = new webkitSpeechRecognition();
    recognition.lang = 'zh-CN';
    recognition.continuous = false;

    recognition.onstart = () => {
      setIsListening(true);
      setError(null);
    };

    recognition.onresult = (event) => {
      const text = event.results[0][0].transcript;
      setTranscript(text);
    };

    recognition.onerror = (event) => {
      setError(`识别错误: ${event.error}`);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  }, []);

  const stopListening = useCallback(() => {
    setIsListening(false);
  }, []);

  return { isListening, transcript, error, startListening, stopListening };
};
```

---

## 4. 后端架构设计

### 4.1 目录结构

```
backend/
├── src/
│   ├── controllers/        # 控制器层
│   │   ├── auth.controller.ts
│   │   ├── trip.controller.ts
│   │   └── budget.controller.ts
│   ├── services/           # 服务层
│   │   ├── auth.service.ts
│   │   ├── trip.service.ts
│   │   ├── llm.service.ts      # 阿里云百炼集成
│   │   ├── map.service.ts      # 高德地图集成
│   │   └── budget.service.ts
│   ├── middleware/         # 中间件
│   │   ├── auth.middleware.ts   # JWT 验证
│   │   ├── validate.middleware.ts  # 请求验证
│   │   ├── rateLimit.middleware.ts # 限流
│   │   └── error.middleware.ts     # 错误处理
│   ├── routes/             # 路由定义
│   │   ├── index.ts
│   │   ├── auth.routes.ts
│   │   ├── trip.routes.ts
│   │   └── budget.routes.ts
│   ├── types/              # 类型定义
│   │   ├── express.d.ts    # Express 扩展类型
│   │   ├── trip.types.ts
│   │   └── api.types.ts
│   ├── utils/              # 工具函数
│   │   ├── logger.ts       # 日志工具
│   │   ├── jwt.ts          # JWT 工具
│   │   └── errors.ts       # 自定义错误类
│   ├── config/             # 配置文件
│   │   ├── supabase.ts     # Supabase 配置
│   │   ├── env.ts          # 环境变量
│   │   └── constants.ts    # 常量定义
│   ├── db/                 # 数据库相关
│   │   ├── supabase.client.ts  # Supabase 客户端
│   │   └── migrations/         # SQL 迁移文件
│   └── server.ts           # 服务器入口
├── .env.example
├── .eslintrc.js
├── .prettierrc
├── tsconfig.json
├── Dockerfile
└── package.json
```

### 4.2 服务器入口

```typescript
// src/server.ts
import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import routes from './routes';
import { errorMiddleware } from './middleware/error.middleware';
import { logger } from './utils/logger';

dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 5000;

// 中间件
app.use(helmet());  // 安全headers
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('combined', { stream: { write: (message) => logger.info(message.trim()) } }));

// 路由
app.use('/api', routes);

// 健康检查
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 错误处理中间件（必须放在最后）
app.use(errorMiddleware);

app.listen(PORT, () => {
  logger.info(`Server is running on port ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV}`);
});
```

### 4.3 控制器层示例

```typescript
// src/controllers/trip.controller.ts
import { Request, Response, NextFunction } from 'express';
import { TripService } from '../services/trip.service';
import { CreateTripDto } from '../types/trip.types';

export class TripController {
  private tripService: TripService;

  constructor() {
    this.tripService = new TripService();
  }

  // 创建行程
  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;  // 从 JWT 中间件获取
      const tripData: CreateTripDto = req.body;

      const trip = await this.tripService.createTrip(userId, tripData);

      res.status(201).json({
        success: true,
        data: trip,
      });
    } catch (error) {
      next(error);
    }
  };

  // 获取行程列表
  list = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const trips = await this.tripService.getUserTrips(userId);

      res.json({
        success: true,
        data: trips,
      });
    } catch (error) {
      next(error);
    }
  };

  // 获取行程详情
  get = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const userId = req.user!.id;

      const trip = await this.tripService.getTripById(id, userId);

      res.json({
        success: true,
        data: trip,
      });
    } catch (error) {
      next(error);
    }
  };

  // 生成行程（调用 AI）
  generate = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const userId = req.user!.id;

      const trip = await this.tripService.generateItinerary(id, userId);

      res.json({
        success: true,
        data: trip,
      });
    } catch (error) {
      next(error);
    }
  };
}
```

### 4.4 服务层示例 (核心业务逻辑)

```typescript
// src/services/trip.service.ts
import { supabase } from '../db/supabase.client';
import { LLMService } from './llm.service';
import { MapService } from './map.service';
import { CreateTripDto, Trip, Itinerary } from '../types/trip.types';
import { NotFoundError, ValidationError } from '../utils/errors';

export class TripService {
  private llmService: LLMService;
  private mapService: MapService;

  constructor() {
    this.llmService = new LLMService();
    this.mapService = new MapService();
  }

  async createTrip(userId: string, tripData: CreateTripDto): Promise<Trip> {
    // 1. 验证数据
    this.validateTripData(tripData);

    // 2. 插入数据库
    const { data, error } = await supabase
      .from('trips')
      .insert({
        user_id: userId,
        destination: tripData.destination,
        start_date: tripData.startDate,
        end_date: tripData.endDate,
        budget: tripData.budget,
        num_travelers: tripData.numTravelers,
        travel_style: tripData.travelStyle,
        preferences: tripData.preferences,
      })
      .select()
      .single();

    if (error) throw error;

    return data as Trip;
  }

  async generateItinerary(tripId: string, userId: string): Promise<Trip> {
    // 1. 获取行程基本信息
    const trip = await this.getTripById(tripId, userId);

    // 2. 构造 Prompt
    const prompt = this.buildPrompt(trip);

    // 3. 调用 LLM 生成行程
    const itineraryText = await this.llmService.generateItinerary(prompt);

    // 4. 解析 LLM 响应
    const itinerary = this.parseItinerary(itineraryText);

    // 5. 调用地图 API 获取地理信息
    const enhancedItinerary = await this.enhanceWithMapData(itinerary);

    // 6. 更新数据库
    const { data, error } = await supabase
      .from('trips')
      .update({
        itinerary: enhancedItinerary,
        updated_at: new Date().toISOString(),
      })
      .eq('id', tripId)
      .select()
      .single();

    if (error) throw error;

    return data as Trip;
  }

  private buildPrompt(trip: Trip): string {
    return `
请为用户规划一个${trip.destination}的旅行方案：

基本信息：
- 目的地：${trip.destination}
- 出发日期：${trip.start_date}
- 返回日期：${trip.end_date}
- 旅行天数：${this.calculateDays(trip.start_date, trip.end_date)}天
- 预算：${trip.budget}元
- 人数：${trip.num_travelers}人
- 旅行风格：${trip.travel_style}

要求：
1. 生成详细的每日行程，包括上午、下午、晚上的活动安排
2. 推荐具体的景点、餐厅、交通方式
3. 给出每个景点的大致费用
4. 路线安排合理，考虑地理位置
5. 总费用控制在预算范围内

请以JSON格式返回，结构如下：
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
          "description": "...",
          "address": "...",
          "cost": 0
        }
      ]
    }
  ],
  "budget_breakdown": {
    "transportation": 600,
    "accommodation": 900,
    "food": 720,
    "tickets": 460,
    "others": 200
  }
}
`;
  }

  private async enhanceWithMapData(itinerary: Itinerary): Promise<Itinerary> {
    // 为每个地点添加坐标信息
    for (const day of itinerary.days) {
      for (const activity of day.activities) {
        if (activity.address) {
          const location = await this.mapService.geocode(activity.address);
          activity.location = location;
        }
      }
    }
    return itinerary;
  }
}
```

### 4.5 LLM 服务集成

```typescript
// src/services/llm.service.ts
import axios from 'axios';
import { logger } from '../utils/logger';

export class LLMService {
  private apiKey: string;
  private baseURL: string;

  constructor() {
    this.apiKey = process.env.ALIYUN_API_KEY || '';
    this.baseURL = process.env.ALIYUN_API_BASE_URL || '';

    if (!this.apiKey) {
      throw new Error('ALIYUN_API_KEY is not configured');
    }
  }

  async generateItinerary(prompt: string): Promise<string> {
    try {
      logger.info('Calling Aliyun LLM API');

      const response = await axios.post(
        `${this.baseURL}/chat/completions`,
        {
          model: 'qwen-max',
          messages: [
            {
              role: 'system',
              content: '你是一个专业的旅行规划助手，擅长为用户制定详细的旅行计划。',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: 0.7,
          max_tokens: 2000,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`,
          },
          timeout: 30000,  // 30秒超时
        }
      );

      const content = response.data.choices[0].message.content;
      logger.info('LLM API call successful');

      return content;
    } catch (error) {
      logger.error('LLM API call failed:', error);
      throw new Error('Failed to generate itinerary');
    }
  }
}
```

### 4.6 地图服务集成

```typescript
// src/services/map.service.ts
import axios from 'axios';
import { logger } from '../utils/logger';

interface Location {
  lng: number;  // 经度
  lat: number;  // 纬度
}

export class MapService {
  private apiKey: string;
  private baseURL: string = 'https://restapi.amap.com/v3';

  constructor() {
    this.apiKey = process.env.AMAP_API_KEY || '';

    if (!this.apiKey) {
      throw new Error('AMAP_API_KEY is not configured');
    }
  }

  // 地理编码：地址 → 坐标
  async geocode(address: string): Promise<Location | null> {
    try {
      const response = await axios.get(`${this.baseURL}/geocode/geo`, {
        params: {
          key: this.apiKey,
          address: address,
        },
      });

      if (response.data.status === '1' && response.data.geocodes.length > 0) {
        const location = response.data.geocodes[0].location.split(',');
        return {
          lng: parseFloat(location[0]),
          lat: parseFloat(location[1]),
        };
      }

      return null;
    } catch (error) {
      logger.error('Geocoding failed:', error);
      return null;
    }
  }

  // POI 搜索：搜索景点
  async searchPOI(keyword: string, city: string): Promise<any[]> {
    try {
      const response = await axios.get(`${this.baseURL}/place/text`, {
        params: {
          key: this.apiKey,
          keywords: keyword,
          city: city,
          offset: 10,
        },
      });

      if (response.data.status === '1') {
        return response.data.pois;
      }

      return [];
    } catch (error) {
      logger.error('POI search failed:', error);
      return [];
    }
  }

  // 路径规划
  async getRoute(origin: Location, destination: Location): Promise<any> {
    try {
      const response = await axios.get(`${this.baseURL}/direction/driving`, {
        params: {
          key: this.apiKey,
          origin: `${origin.lng},${origin.lat}`,
          destination: `${destination.lng},${destination.lat}`,
        },
      });

      if (response.data.status === '1') {
        return response.data.route;
      }

      return null;
    } catch (error) {
      logger.error('Route planning failed:', error);
      return null;
    }
  }
}
```

### 4.7 认证中间件

```typescript
// src/middleware/auth.middleware.ts
import { Request, Response, NextFunction } from 'express';
import { supabase } from '../db/supabase.client';
import { UnauthorizedError } from '../utils/errors';

// 扩展 Express Request 类型
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
      };
    }
  }
}

export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('Missing or invalid authorization header');
    }

    const token = authHeader.substring(7);

    // 使用 Supabase 验证 JWT
    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data.user) {
      throw new UnauthorizedError('Invalid or expired token');
    }

    // 将用户信息附加到请求对象
    req.user = {
      id: data.user.id,
      email: data.user.email!,
    };

    next();
  } catch (error) {
    next(error);
  }
};
```

---

## 5. 数据库设计

详见 `DATABASE_DESIGN.md` 文档。

关键要点：
- 使用 Supabase 提供的 PostgreSQL
- 启用 Row Level Security (RLS) 策略
- 设计4个主要表：users, trips, expenses, trip_preferences
- 使用 UUID 作为主键
- 使用 JSONB 存储复杂数据（行程、偏好）

---

## 6. API 设计

详见 `API_DOCUMENTATION.md` 文档。

### 6.1 API 设计原则

- RESTful 风格
- 统一响应格式
- 版本控制 (/api/v1)
- JWT 认证
- 错误码标准化

### 6.2 统一响应格式

```typescript
// 成功响应
{
  "success": true,
  "data": { ... },
  "message": "操作成功"
}

// 错误响应
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "参数验证失败",
    "details": [...]
  }
}
```

---

## 7. 第三方服务集成

### 7.1 阿里云百炼集成

**用途**: LLM API，生成旅行行程

**集成方式**:
- REST API 调用
- Bearer Token 认证
- 使用 qwen-max 模型

**关键配置**:
```env
ALIYUN_API_KEY=your-key
ALIYUN_API_BASE_URL=https://dashscope.aliyuncs.com/api/v1
```

**限流策略**:
- 请求缓存（相同参数 1 小时内复用）
- 失败重试（最多 3 次，指数退避）

### 7.2 高德地图集成

**用途**: 地图可视化、地理编码、路径规划

**集成方式**:
- 前端：高德地图 JS API 2.0
- 后端：高德 REST API

**关键功能**:
- 地理编码（地址 → 坐标）
- POI 搜索
- 路径规划
- 地图展示和标记

**关键配置**:
```env
AMAP_API_KEY=your-key
AMAP_WEB_KEY=your-web-key  # 前端使用
```

### 7.3 Supabase 集成

**用途**: 数据库 + 认证 + 文件存储

**集成方式**:
- 官方 JavaScript SDK
- Row Level Security (RLS) 策略
- 实时订阅（可选）

**关键配置**:
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key  # 仅后端使用
```

---

## 8. 安全设计

### 8.1 认证与授权

| 机制 | 实现方式 |
|------|---------|
| **用户认证** | Supabase Auth + JWT Token |
| **Token 存储** | HttpOnly Cookie (推荐) 或 localStorage |
| **Token 过期** | Access Token 1小时，Refresh Token 7天 |
| **权限控制** | Row Level Security (RLS) 策略 |

### 8.2 数据安全

| 措施 | 说明 |
|------|------|
| **密码加密** | bcrypt hash (Supabase 自动处理) |
| **HTTPS** | 生产环境强制 HTTPS |
| **SQL 注入防护** | 使用 Supabase Client，参数化查询 |
| **XSS 防护** | React 自动转义，CSP 头部 |
| **CSRF 防护** | SameSite Cookie + CSRF Token |

### 8.3 API 安全

```typescript
// 限流中间件
import rateLimit from 'express-rate-limit';

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15分钟
  max: 100,  // 最多100个请求
  message: '请求过于频繁，请稍后再试',
});

app.use('/api/', apiLimiter);
```

### 8.4 环境变量管理

```bash
# 开发环境
cp .env.example .env

# 生产环境
# 使用云服务商的 Secrets Manager（如 AWS Secrets Manager）
```

**禁止**:
- ❌ 在代码中硬编码 API Key
- ❌ 提交 .env 文件到 Git
- ❌ 前端暴露敏感 Key（仅 Web Key 可以暴露）

---

## 9. 性能优化方案

### 9.1 前端性能优化

| 优化项 | 方案 |
|--------|------|
| **代码分割** | React.lazy + Suspense，路由级别懒加载 |
| **图片优化** | WebP 格式，懒加载，CDN 加速 |
| **缓存策略** | Service Worker，localStorage 缓存 |
| **打包优化** | Vite 自动 Tree Shaking，代码压缩 |
| **首屏优化** | SSR (可选)，骨架屏，预加载关键资源 |

### 9.2 后端性能优化

| 优化项 | 方案 |
|--------|------|
| **数据库查询** | 添加索引，查询优化，连接池 |
| **API 缓存** | Redis 缓存热点数据（可选） |
| **请求压缩** | gzip / brotli 压缩响应 |
| **并发处理** | Node.js 异步 I/O，集群模式 |
| **日志优化** | 异步日志写入，日志分级 |

### 9.3 地图性能优化

- 地图数据懒加载
- 标记点聚合（Marker Clustering）
- 地图瓦片缓存

---

## 10. 部署架构

### 10.1 Docker 容器化

**Dockerfile (Frontend)**:
```dockerfile
# frontend/Dockerfile
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

**Dockerfile (Backend)**:
```dockerfile
# backend/Dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
RUN npm run build

EXPOSE 5000
CMD ["node", "dist/server.js"]
```

### 10.2 Docker Compose

```yaml
# docker-compose.yml
version: '3.8'

services:
  backend:
    build: ./backend
    container_name: travel-ai-backend
    ports:
      - "5000:5000"
    environment:
      - NODE_ENV=production
      - SUPABASE_URL=${SUPABASE_URL}
      - SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_SERVICE_ROLE_KEY}
      - ALIYUN_API_KEY=${ALIYUN_API_KEY}
      - AMAP_API_KEY=${AMAP_API_KEY}
    env_file:
      - ./backend/.env
    restart: unless-stopped
    networks:
      - travel-ai-network

  frontend:
    build: ./frontend
    container_name: travel-ai-frontend
    ports:
      - "3000:80"
    environment:
      - VITE_API_BASE_URL=http://backend:5000/api
    depends_on:
      - backend
    restart: unless-stopped
    networks:
      - travel-ai-network

networks:
  travel-ai-network:
    driver: bridge
```

### 10.3 部署流程

```bash
# 1. 克隆代码
git clone <repo-url>
cd travel-ai

# 2. 配置环境变量
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
# 编辑 .env 文件，填入真实 API Key

# 3. 一键启动
docker-compose up --build

# 4. 访问应用
# 前端: http://localhost:3000
# 后端: http://localhost:5000
```

---

## 11. 开发规范

### 11.1 代码规范

**ESLint 配置**:
```javascript
// .eslintrc.js
module.exports = {
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'prettier',
  ],
  rules: {
    'no-console': 'warn',
    '@typescript-eslint/no-unused-vars': 'error',
    'react/react-in-jsx-scope': 'off',  // React 17+
  },
};
```

**Prettier 配置**:
```json
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100
}
```

### 11.2 Git 规范

**分支管理**:
- `main`: 主分支，稳定版本
- `develop`: 开发分支
- `feature/xxx`: 功能分支
- `fix/xxx`: Bug 修复分支

**Commit 规范**:
```
<type>(<scope>): <subject>

type: feat, fix, docs, style, refactor, test, chore
例子:
feat(trip): 添加行程生成功能
fix(auth): 修复 token 过期问题
docs(readme): 更新部署文档
```

### 11.3 命名规范

| 类型 | 规范 | 示例 |
|------|------|------|
| **文件名** | kebab-case | trip-card.tsx |
| **组件名** | PascalCase | TripCard |
| **函数/变量** | camelCase | createTrip, userId |
| **常量** | UPPER_SNAKE_CASE | API_BASE_URL |
| **类型/接口** | PascalCase | User, CreateTripDto |

---

## 12. 测试策略

### 12.1 测试金字塔

```
        /\
       /  \  E2E 测试 (10%)
      /____\
     /      \  集成测试 (30%)
    /________\
   /          \  单元测试 (60%)
  /__________  \
```

### 12.2 单元测试 (Jest / Vitest)

```typescript
// src/utils/__tests__/format.test.ts
import { formatCurrency, formatDate } from '../format';

describe('formatCurrency', () => {
  it('should format number to currency string', () => {
    expect(formatCurrency(3000)).toBe('¥3,000');
  });
});

describe('formatDate', () => {
  it('should format date to YYYY-MM-DD', () => {
    const date = new Date('2025-11-15');
    expect(formatDate(date)).toBe('2025-11-15');
  });
});
```

### 12.3 集成测试 (Supertest)

```typescript
// src/__tests__/trip.integration.test.ts
import request from 'supertest';
import app from '../server';

describe('Trip API', () => {
  let authToken: string;

  beforeAll(async () => {
    // 登录获取 token
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@example.com', password: 'password123' });

    authToken = res.body.token;
  });

  it('should create a new trip', async () => {
    const res = await request(app)
      .post('/api/trips')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        destination: '杭州',
        startDate: '2025-11-15',
        endDate: '2025-11-17',
        budget: 3000,
        numTravelers: 2,
      });

    expect(res.status).toBe(201);
    expect(res.body.data).toHaveProperty('id');
  });
});
```

---

## 附录

### A. 技术选型对比

**前端框架**:
| 框架 | 优势 | 劣势 | 选择 |
|------|------|------|------|
| React | 生态最丰富，社区活跃 | 学习曲线较陡 | ✅ 选用 |
| Vue 3 | 易学，文档友好 | 生态相对较小 | - |
| Svelte | 性能最好，无虚拟DOM | 生态较新，库少 | - |

**后端框架**:
| 框架 | 优势 | 劣势 | 选择 |
|------|------|------|------|
| Express | 轻量灵活，生态丰富 | 缺少内置功能 | ✅ 选用 |
| NestJS | 企业级，TypeScript原生 | 学习曲线陡，重 | - |
| Fastify | 性能最好 | 生态较小 | - |

### B. 参考资料

- [React 官方文档](https://react.dev/)
- [Vite 官方文档](https://vitejs.dev/)
- [Express 官方文档](https://expressjs.com/)
- [Supabase 官方文档](https://supabase.com/docs)
- [阿里云百炼文档](https://help.aliyun.com/zh/model-studio/)
- [高德地图 JS API](https://lbs.amap.com/api/javascript-api-v2/summary)
- [TypeScript 官方文档](https://www.typescriptlang.org/)

---

## 文档变更记录

| 版本 | 日期 | 修改人 | 变更说明 |
|------|------|--------|---------|
| v1.0 | 2025-11-04 | Claude | 初始版本，完整技术设计文档 |


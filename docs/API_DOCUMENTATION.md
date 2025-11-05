# API 接口文档 (API Documentation)

## 文档信息

| 项目名称 | AI 旅行规划师 (AI Travel Planner) |
|---------|----------------------------------|
| 文档版本 | v1.0 |
| API 版本 | v1 |
| Base URL | `http://localhost:5000/api` (开发环境) |
| 创建日期 | 2025-11-04 |

---

## 目录

1. [API 概述](#1-api-概述)
2. [认证机制](#2-认证机制)
3. [请求与响应格式](#3-请求与响应格式)
4. [错误处理](#4-错误处理)
5. [认证接口](#5-认证接口)
6. [行程管理接口](#6-行程管理接口)
7. [预算管理接口](#7-预算管理接口)
8. [用户偏好接口](#8-用户偏好接口)
9. [健康检查接口](#9-健康检查接口)

---

## 1. API 概述

### 1.1 基本信息

- **协议**: HTTPS (生产环境) / HTTP (开发环境)
- **编码**: UTF-8
- **Content-Type**: `application/json`
- **API 风格**: RESTful
- **版本控制**: URL 路径版本 (`/api/v1`)

### 1.2 环境配置

| 环境 | Base URL | 说明 |
|------|----------|------|
| 开发环境 | `http://localhost:5000/api` | 本地开发 |
| 生产环境 | `https://api.travel-ai.com/api` | 线上环境 |

### 1.3 速率限制

| 限制类型 | 限制值 | 窗口期 |
|---------|--------|--------|
| 全局限制 | 100 请求 | 15 分钟 |
| 认证接口 | 5 请求 | 15 分钟 |
| AI 生成 | 10 请求 | 1 小时 |

---

## 2. 认证机制

### 2.1 JWT Token 认证

所有受保护的接口都需要在请求头中携带 JWT Token：

```http
Authorization: Bearer <your_jwt_token>
```

### 2.2 获取 Token

通过登录接口获取：

```bash
POST /api/auth/login
{
  "email": "user@example.com",
  "password": "password123"
}

# 响应
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh_token": "..."
  }
}
```

### 2.3 Token 过期

- **Access Token**: 1 小时
- **Refresh Token**: 7 天

Token 过期后需要使用 Refresh Token 刷新。

---

## 3. 请求与响应格式

### 3.1 请求头

```http
Content-Type: application/json
Authorization: Bearer <token>
Accept: application/json
```

### 3.2 成功响应格式

```json
{
  "success": true,
  "data": { ... },
  "message": "操作成功"
}
```

### 3.3 错误响应格式

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "错误描述",
    "details": [...]
  }
}
```

### 3.4 分页响应格式

```json
{
  "success": true,
  "data": {
    "items": [...],
    "pagination": {
      "page": 1,
      "pageSize": 20,
      "total": 100,
      "totalPages": 5
    }
  }
}
```

---

## 4. 错误处理

### 4.1 HTTP 状态码

| 状态码 | 说明 |
|--------|------|
| 200 | 请求成功 |
| 201 | 创建成功 |
| 400 | 请求参数错误 |
| 401 | 未认证或 Token 无效 |
| 403 | 无权限访问 |
| 404 | 资源不存在 |
| 429 | 请求过于频繁 |
| 500 | 服务器内部错误 |
| 503 | 服务暂时不可用 |

### 4.2 错误码定义

| 错误码 | HTTP 状态码 | 说明 |
|--------|-----------|------|
| `VALIDATION_ERROR` | 400 | 参数验证失败 |
| `UNAUTHORIZED` | 401 | 未认证 |
| `TOKEN_EXPIRED` | 401 | Token 已过期 |
| `FORBIDDEN` | 403 | 无权限访问 |
| `NOT_FOUND` | 404 | 资源不存在 |
| `DUPLICATE_ENTRY` | 409 | 重复的数据 |
| `RATE_LIMIT_EXCEEDED` | 429 | 超出速率限制 |
| `INTERNAL_ERROR` | 500 | 服务器内部错误 |
| `EXTERNAL_API_ERROR` | 503 | 外部 API 调用失败 |

### 4.3 错误响应示例

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "参数验证失败",
    "details": [
      {
        "field": "email",
        "message": "邮箱格式不正确"
      },
      {
        "field": "budget",
        "message": "预算必须大于 0"
      }
    ]
  }
}
```

---

## 5. 认证接口

### 5.1 用户注册

**接口**: `POST /api/auth/register`

**说明**: 创建新用户账号

**请求头**: 无需认证

**请求体**:
```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "张三"
}
```

**字段说明**:
| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| email | string | 是 | 邮箱地址 |
| password | string | 是 | 密码（至少8位，包含字母和数字） |
| name | string | 是 | 用户姓名 |

**成功响应** (201):
```json
{
  "success": true,
  "data": {
    "message": "注册成功，请查收验证邮件"
  }
}
```

**错误响应**:
- 400: 参数验证失败
- 409: 邮箱已被注册

---

### 5.2 用户登录

**接口**: `POST /api/auth/login`

**说明**: 用户登录获取 JWT Token

**请求头**: 无需认证

**请求体**:
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**成功响应** (200):
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "user@example.com",
      "name": "张三"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh_token": "dGhpcyBpcyByZWZyZXNoIHRva2Vu..."
  }
}
```

**错误响应**:
- 400: 参数验证失败
- 401: 邮箱或密码错误

---

### 5.3 用户登出

**接口**: `POST /api/auth/logout`

**说明**: 用户登出（使 Token 失效）

**请求头**: 需要认证

**请求体**: 无

**成功响应** (200):
```json
{
  "success": true,
  "message": "登出成功"
}
```

---

### 5.4 刷新 Token

**接口**: `POST /api/auth/refresh`

**说明**: 使用 Refresh Token 刷新 Access Token

**请求头**: 无需认证

**请求体**:
```json
{
  "refresh_token": "dGhpcyBpcyByZWZyZXNoIHRva2Vu..."
}
```

**成功响应** (200):
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh_token": "bmV3IHJlZnJlc2ggdG9rZW4..."
  }
}
```

---

## 6. 行程管理接口

### 6.1 创建行程

**接口**: `POST /api/trips`

**说明**: 创建新的旅行计划

**请求头**: 需要认证

**请求体**:
```json
{
  "destination": "杭州",
  "startDate": "2025-11-15",
  "endDate": "2025-11-17",
  "budget": 3000,
  "numTravelers": 2,
  "travelStyle": "cultural",
  "preferences": {
    "cuisines": ["杭帮菜", "本地特色"],
    "mustVisit": ["西湖", "雷峰塔"],
    "accommodation": "hotel"
  }
}
```

**字段说明**:
| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| destination | string | 是 | 目的地城市 |
| startDate | string | 是 | 出发日期 (YYYY-MM-DD) |
| endDate | string | 是 | 返回日期 (YYYY-MM-DD) |
| budget | number | 是 | 预算（元） |
| numTravelers | number | 是 | 同行人数 |
| travelStyle | string | 否 | 旅行风格：adventure/cultural/leisure/foodie |
| preferences | object | 否 | 其他偏好 |

**成功响应** (201):
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "userId": "user-id",
    "destination": "杭州",
    "startDate": "2025-11-15",
    "endDate": "2025-11-17",
    "budget": 3000,
    "numTravelers": 2,
    "travelStyle": "cultural",
    "preferences": { ... },
    "itinerary": null,
    "createdAt": "2025-11-04T10:00:00Z",
    "updatedAt": "2025-11-04T10:00:00Z"
  }
}
```

**错误响应**:
- 400: 参数验证失败
- 401: 未认证

---

### 6.2 获取行程列表

**接口**: `GET /api/trips`

**说明**: 获取当前用户的所有旅行计划

**请求头**: 需要认证

**查询参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | number | 否 | 页码（默认 1） |
| pageSize | number | 否 | 每页数量（默认 20） |
| status | string | 否 | 状态筛选：upcoming/ongoing/completed |
| sort | string | 否 | 排序方式：startDate/-startDate/createdAt/-createdAt |

**成功响应** (200):
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "trip-id-1",
        "destination": "杭州",
        "startDate": "2025-11-15",
        "endDate": "2025-11-17",
        "budget": 3000,
        "numTravelers": 2,
        "travelStyle": "cultural",
        "createdAt": "2025-11-04T10:00:00Z"
      },
      {
        "id": "trip-id-2",
        "destination": "成都",
        "startDate": "2025-12-01",
        "endDate": "2025-12-05",
        "budget": 4500,
        "numTravelers": 3,
        "travelStyle": "foodie",
        "createdAt": "2025-11-03T15:30:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "pageSize": 20,
      "total": 2,
      "totalPages": 1
    }
  }
}
```

---

### 6.3 获取行程详情

**接口**: `GET /api/trips/:id`

**说明**: 获取指定行程的详细信息

**请求头**: 需要认证

**路径参数**:
| 参数 | 类型 | 说明 |
|------|------|------|
| id | string | 行程 ID |

**成功响应** (200):
```json
{
  "success": true,
  "data": {
    "id": "trip-id",
    "userId": "user-id",
    "destination": "杭州",
    "startDate": "2025-11-15",
    "endDate": "2025-11-17",
    "budget": 3000,
    "numTravelers": 2,
    "travelStyle": "cultural",
    "preferences": { ... },
    "itinerary": {
      "days": [
        {
          "day": 1,
          "date": "2025-11-15",
          "activities": [
            {
              "time": "9:00-12:00",
              "type": "景点",
              "name": "西湖",
              "description": "游览西湖风景区",
              "address": "杭州市西湖区西湖风景名胜区",
              "location": {
                "lng": 120.148262,
                "lat": 30.259244
              },
              "cost": 0,
              "duration": 180
            }
          ],
          "accommodation": {
            "name": "汉庭酒店(西湖店)",
            "cost": 300
          },
          "dailyCost": 980
        }
      ],
      "summary": {
        "totalDistance": "35km",
        "totalDays": 3,
        "totalCost": 2880
      }
    },
    "budgetBreakdown": {
      "transportation": 600,
      "accommodation": 900,
      "food": 720,
      "tickets": 460,
      "others": 200,
      "total": 2880
    },
    "createdAt": "2025-11-04T10:00:00Z",
    "updatedAt": "2025-11-04T11:30:00Z"
  }
}
```

**错误响应**:
- 401: 未认证
- 403: 无权访问此行程
- 404: 行程不存在

---

### 6.4 生成行程

**接口**: `POST /api/trips/:id/generate`

**说明**: 使用 AI 生成详细行程

**请求头**: 需要认证

**路径参数**:
| 参数 | 类型 | 说明 |
|------|------|------|
| id | string | 行程 ID |

**请求体**: 无

**成功响应** (200):
```json
{
  "success": true,
  "data": {
    "id": "trip-id",
    "itinerary": { ... },
    "budgetBreakdown": { ... },
    "updatedAt": "2025-11-04T11:30:00Z"
  },
  "message": "行程生成成功"
}
```

**错误响应**:
- 401: 未认证
- 403: 无权访问此行程
- 404: 行程不存在
- 503: AI 服务暂时不可用

**说明**: 该接口可能需要 15-30 秒完成，建议前端显示 Loading 状态。

---

### 6.5 更新行程

**接口**: `PUT /api/trips/:id`

**说明**: 更新行程基本信息

**请求头**: 需要认证

**路径参数**:
| 参数 | 类型 | 说明 |
|------|------|------|
| id | string | 行程 ID |

**请求体**:
```json
{
  "destination": "杭州",
  "startDate": "2025-11-16",
  "endDate": "2025-11-18",
  "budget": 3500,
  "numTravelers": 3
}
```

**成功响应** (200):
```json
{
  "success": true,
  "data": {
    "id": "trip-id",
    ...
  },
  "message": "更新成功"
}
```

**错误响应**:
- 400: 参数验证失败
- 401: 未认证
- 403: 无权访问此行程
- 404: 行程不存在

---

### 6.6 删除行程

**接口**: `DELETE /api/trips/:id`

**说明**: 删除指定行程

**请求头**: 需要认证

**路径参数**:
| 参数 | 类型 | 说明 |
|------|------|------|
| id | string | 行程 ID |

**成功响应** (200):
```json
{
  "success": true,
  "message": "删除成功"
}
```

**错误响应**:
- 401: 未认证
- 403: 无权访问此行程
- 404: 行程不存在

---

### 6.7 获取地图数据

**接口**: `GET /api/trips/:id/map-data`

**说明**: 获取行程的地图标记点和路线数据

**请求头**: 需要认证

**路径参数**:
| 参数 | 类型 | 说明 |
|------|------|------|
| id | string | 行程 ID |

**成功响应** (200):
```json
{
  "success": true,
  "data": {
    "markers": [
      {
        "id": "marker-1",
        "name": "西湖",
        "type": "attraction",
        "location": {
          "lng": 120.148262,
          "lat": 30.259244
        },
        "day": 1
      }
    ],
    "routes": [
      {
        "day": 1,
        "path": [
          { "lng": 120.148262, "lat": 30.259244 },
          { "lng": 120.165892, "lat": 30.256441 }
        ],
        "distance": "5km",
        "duration": "15min"
      }
    ]
  }
}
```

---

## 7. 预算管理接口

### 7.1 获取预算概览

**接口**: `GET /api/trips/:id/budget`

**说明**: 获取行程的预算分析和实际花费对比

**请求头**: 需要认证

**路径参数**:
| 参数 | 类型 | 说明 |
|------|------|------|
| id | string | 行程 ID |

**成功响应** (200):
```json
{
  "success": true,
  "data": {
    "budget": 3000,
    "estimated": 2880,
    "actual": 1250,
    "remaining": 1750,
    "breakdown": {
      "estimated": {
        "transportation": 600,
        "accommodation": 900,
        "food": 720,
        "tickets": 460,
        "others": 200
      },
      "actual": {
        "transportation": 10,
        "accommodation": 320,
        "food": 160,
        "tickets": 40,
        "others": 0
      }
    }
  }
}
```

---

### 7.2 添加费用记录

**接口**: `POST /api/trips/:id/expenses`

**说明**: 为行程添加实际开销记录

**请求头**: 需要认证

**路径参数**:
| 参数 | 类型 | 说明 |
|------|------|------|
| id | string | 行程 ID |

**请求体**:
```json
{
  "category": "food",
  "amount": 160,
  "description": "外婆家午餐",
  "expenseDate": "2025-11-15"
}
```

**字段说明**:
| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| category | string | 是 | 类别：transportation/accommodation/food/tickets/others |
| amount | number | 是 | 金额（元） |
| description | string | 否 | 描述 |
| expenseDate | string | 是 | 开销日期 (YYYY-MM-DD) |

**成功响应** (201):
```json
{
  "success": true,
  "data": {
    "id": "expense-id",
    "tripId": "trip-id",
    "category": "food",
    "amount": 160,
    "description": "外婆家午餐",
    "expenseDate": "2025-11-15",
    "createdAt": "2025-11-15T13:30:00Z"
  }
}
```

---

### 7.3 获取费用记录列表

**接口**: `GET /api/trips/:id/expenses`

**说明**: 获取行程的所有费用记录

**请求头**: 需要认证

**路径参数**:
| 参数 | 类型 | 说明 |
|------|------|------|
| id | string | 行程 ID |

**查询参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| category | string | 否 | 按类别筛选 |

**成功响应** (200):
```json
{
  "success": true,
  "data": {
    "expenses": [
      {
        "id": "expense-1",
        "category": "transportation",
        "amount": 10,
        "description": "地铁票",
        "expenseDate": "2025-11-15",
        "createdAt": "2025-11-15T09:30:00Z"
      },
      {
        "id": "expense-2",
        "category": "food",
        "amount": 160,
        "description": "外婆家午餐",
        "expenseDate": "2025-11-15",
        "createdAt": "2025-11-15T13:30:00Z"
      }
    ],
    "summary": {
      "total": 170,
      "byCategory": {
        "transportation": 10,
        "food": 160
      }
    }
  }
}
```

---

### 7.4 更新费用记录

**接口**: `PUT /api/expenses/:id`

**说明**: 更新指定费用记录

**请求头**: 需要认证

**路径参数**:
| 参数 | 类型 | 说明 |
|------|------|------|
| id | string | 费用记录 ID |

**请求体**:
```json
{
  "amount": 180,
  "description": "外婆家午餐（更新）"
}
```

**成功响应** (200):
```json
{
  "success": true,
  "data": {
    "id": "expense-id",
    ...
  },
  "message": "更新成功"
}
```

---

### 7.5 删除费用记录

**接口**: `DELETE /api/expenses/:id`

**说明**: 删除指定费用记录

**请求头**: 需要认证

**路径参数**:
| 参数 | 类型 | 说明 |
|------|------|------|
| id | string | 费用记录 ID |

**成功响应** (200):
```json
{
  "success": true,
  "message": "删除成功"
}
```

---

## 8. 用户偏好接口

### 8.1 获取用户偏好

**接口**: `GET /api/user/preferences`

**说明**: 获取当前用户的旅行偏好设置

**请求头**: 需要认证

**成功响应** (200):
```json
{
  "success": true,
  "data": {
    "userId": "user-id",
    "preferredCuisines": ["川菜", "粤菜", "本地特色"],
    "activityInterests": ["hiking", "museums", "beaches"],
    "accommodationTypes": ["hotel", "airbnb"],
    "budgetPreference": "medium",
    "createdAt": "2025-11-04T10:00:00Z",
    "updatedAt": "2025-11-04T10:00:00Z"
  }
}
```

---

### 8.2 更新用户偏好

**接口**: `PUT /api/user/preferences`

**说明**: 更新当前用户的旅行偏好设置

**请求头**: 需要认证

**请求体**:
```json
{
  "preferredCuisines": ["川菜", "粤菜", "本地特色"],
  "activityInterests": ["hiking", "museums", "beaches"],
  "accommodationTypes": ["hotel", "airbnb"],
  "budgetPreference": "medium"
}
```

**成功响应** (200):
```json
{
  "success": true,
  "data": {
    ...
  },
  "message": "更新成功"
}
```

---

## 9. 健康检查接口

### 9.1 健康检查

**接口**: `GET /health`

**说明**: 检查 API 服务状态

**请求头**: 无需认证

**成功响应** (200):
```json
{
  "status": "ok",
  "timestamp": "2025-11-04T10:00:00Z",
  "version": "1.0.0"
}
```

---

## 10. 示例代码

### 10.1 JavaScript (Axios)

```javascript
import axios from 'axios';

const apiClient = axios.create({
  baseURL: 'http://localhost:5000/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 登录
async function login(email, password) {
  const response = await apiClient.post('/auth/login', {
    email,
    password,
  });
  return response.data;
}

// 创建行程
async function createTrip(token, tripData) {
  const response = await apiClient.post('/trips', tripData, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
}

// 生成行程
async function generateItinerary(token, tripId) {
  const response = await apiClient.post(`/trips/${tripId}/generate`, {}, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
}
```

### 10.2 Python (requests)

```python
import requests

BASE_URL = 'http://localhost:5000/api'

# 登录
def login(email, password):
    response = requests.post(
        f'{BASE_URL}/auth/login',
        json={'email': email, 'password': password}
    )
    return response.json()

# 获取行程列表
def get_trips(token):
    response = requests.get(
        f'{BASE_URL}/trips',
        headers={'Authorization': f'Bearer {token}'}
    )
    return response.json()

# 添加费用记录
def add_expense(token, trip_id, expense_data):
    response = requests.post(
        f'{BASE_URL}/trips/{trip_id}/expenses',
        json=expense_data,
        headers={'Authorization': f'Bearer {token}'}
    )
    return response.json()
```

### 10.3 cURL

```bash
# 登录
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'

# 创建行程（需要替换 TOKEN）
curl -X POST http://localhost:5000/api/trips \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "destination": "杭州",
    "startDate": "2025-11-15",
    "endDate": "2025-11-17",
    "budget": 3000,
    "numTravelers": 2
  }'

# 获取行程列表
curl -X GET http://localhost:5000/api/trips \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 11. Postman Collection

可以导入以下 JSON 到 Postman 进行测试：

```json
{
  "info": {
    "name": "AI Travel Planner API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Auth",
      "item": [
        {
          "name": "Login",
          "request": {
            "method": "POST",
            "header": [],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"email\": \"user@example.com\",\n  \"password\": \"password123\"\n}",
              "options": {
                "raw": {
                  "language": "json"
                }
              }
            },
            "url": {
              "raw": "{{baseUrl}}/auth/login",
              "host": ["{{baseUrl}}"],
              "path": ["auth", "login"]
            }
          }
        }
      ]
    }
  ],
  "variable": [
    {
      "key": "baseUrl",
      "value": "http://localhost:5000/api"
    }
  ]
}
```

---

## 附录

### A. 数据模型参考

详见 `DATABASE_DESIGN.md` 文档。

### B. 变更记录

| 版本 | 日期 | 修改人 | 变更说明 |
|------|------|--------|---------|
| v1.0 | 2025-11-04 | Claude | 初始版本，完整 API 文档 |

---

## 联系方式

如有问题，请通过以下方式联系：
- 项目仓库: [GitHub](https://github.com/your-repo)
- 邮箱: support@travel-ai.com


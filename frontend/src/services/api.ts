import axios from 'axios';
import type { AxiosInstance } from 'axios';
import type {
  AuthResponse,
  Trip,
  Expense,
  BudgetSummary,
} from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// 创建 axios 实例
const apiClient: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器 - 添加 JWT token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器 - 处理错误
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token 过期或无效，清除本地存储并跳转到登录页
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

/**
 * 认证 API
 */
export const authAPI = {
  // 注册
  signup: async (email: string, password: string, fullName?: string): Promise<AuthResponse> => {
    const { data } = await apiClient.post<AuthResponse>('/auth/signup', {
      email,
      password,
      fullName,
    });
    return data;
  },

  // 登录
  login: async (email: string, password: string): Promise<AuthResponse> => {
    const { data } = await apiClient.post<AuthResponse>('/auth/login', {
      email,
      password,
    });
    return data;
  },

  // 获取当前用户
  me: async () => {
    const { data } = await apiClient.get('/auth/me');
    return data;
  },

  // 登出
  logout: async () => {
    await apiClient.post('/auth/logout');
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
  },
};

/**
 * 旅行计划 API
 */
export const tripsAPI = {
  // 解析语音文本（使用 AI）
  parseVoiceText: async (text: string): Promise<{
    data: {
      title?: string;
      destination?: string;
      startDate?: string;
      endDate?: string;
      travelerCount?: number;
      budgetTotal?: number;
      preferences?: string;
    };
  }> => {
    const { data } = await axios.post(`${API_URL}/api/trips/parse-voice`, { text });
    return data;
  },

  // 获取旅行列表
  getTrips: async (): Promise<{ trips: Trip[] }> => {
    const { data } = await apiClient.get('/api/trips');
    return data;
  },

  // 创建旅行
  createTrip: async (tripData: {
    title: string;
    destination: string;
    startDate: string;
    endDate: string;
    travelerCount: number;
    budgetTotal?: number;
    currency?: string;
    preferences?: string;
  }): Promise<{ trip: Trip }> => {
    const { data } = await apiClient.post('/api/trips', tripData);
    return data;
  },

  // 获取旅行详情
  getTripById: async (id: string): Promise<{ trip: Trip }> => {
    const { data } = await apiClient.get(`/api/trips/${id}`);
    return data;
  },

  // 更新旅行
  updateTrip: async (id: string, updates: Partial<Trip>): Promise<{ trip: Trip }> => {
    const { data } = await apiClient.put(`/api/trips/${id}`, updates);
    return data;
  },

  // 删除旅行
  deleteTrip: async (id: string): Promise<void> => {
    await apiClient.delete(`/api/trips/${id}`);
  },

  // 生成 AI 行程
  generateItinerary: async (id: string): Promise<{ trip: Trip }> => {
    const { data } = await apiClient.post(`/api/trips/${id}/generate`);
    return data;
  },

  // 获取预算摘要
  getBudget: async (id: string): Promise<{ budget: BudgetSummary }> => {
    const { data } = await apiClient.get(`/api/trips/${id}/budget`);
    return data;
  },
};

/**
 * 支出 API
 */
export const expensesAPI = {
  // 获取支出列表
  getExpenses: async (tripId: string): Promise<{ expenses: Expense[] }> => {
    const { data } = await apiClient.get(`/api/trips/${tripId}/expenses`);
    return data;
  },

  // 添加支出
  addExpense: async (
    tripId: string,
    expense: {
      category: string;
      amount: number;
      currency: string;
      description?: string;
      expenseDate: string;
    }
  ): Promise<{ expense: Expense }> => {
    const { data } = await apiClient.post(`/api/trips/${tripId}/expenses`, expense);
    return data;
  },

  // 更新支出
  updateExpense: async (
    tripId: string,
    expenseId: string,
    updates: Partial<Expense>
  ): Promise<{ expense: Expense }> => {
    const { data } = await apiClient.put(`/api/trips/${tripId}/expenses/${expenseId}`, updates);
    return data;
  },

  // 删除支出
  deleteExpense: async (tripId: string, expenseId: string): Promise<void> => {
    await apiClient.delete(`/api/trips/${tripId}/expenses/${expenseId}`);
  },
};

export default apiClient;

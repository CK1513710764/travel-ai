/**
 * 前端类型定义
 */

// 用户
export interface User {
  id: string;
  email: string;
  fullName?: string;
}

// 认证响应
export interface AuthResponse {
  user: User;
  session: {
    access_token: string;
    refresh_token?: string;
  };
}

// 旅行计划
export interface Trip {
  id: string;
  user_id: string;
  title: string;
  destination: string;
  start_date: string;
  end_date: string;
  traveler_count: number;
  budget_total?: number;
  currency?: string;
  status?: string;
  itinerary?: Itinerary;
  created_at?: string;
  updated_at?: string;
}

// AI 行程
export interface Itinerary {
  summary: string;
  days: ItineraryDay[];
  tips: string[];
  estimatedTotalCost?: number;
}

export interface ItineraryDay {
  day: number;
  date: string;
  title: string;
  activities: Activity[];
  meals: {
    breakfast?: string;
    lunch?: string;
    dinner?: string;
  };
  accommodation?: string;
  notes?: string;
}

export interface Activity {
  time: string;
  activity: string;
  location: string;
  description?: string;
  estimatedCost?: number;
}

// 支出
export interface Expense {
  id: string;
  trip_id: string;
  user_id: string;
  category: string;
  amount: number;
  currency: string;
  description?: string;
  expense_date: string;
  created_at?: string;
}

// 预算摘要
export interface BudgetSummary {
  total: number;
  spent: number;
  remaining: number;
  currency: string;
  byCategory: Array<{
    category: string;
    total: number;
  }>;
}

// API 响应
export interface ApiResponse<T> {
  data?: T;
  error?: string;
}

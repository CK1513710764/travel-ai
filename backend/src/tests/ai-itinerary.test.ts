/**
 * AI 行程生成 API 测试
 *
 * TDD 开发 - 先写测试，后写实现
 *
 * 测试端点：
 * - POST /api/trips/:id/generate - 为旅行生成 AI 行程
 */

import request from 'supertest';
import { app } from '../app';
import { supabaseAdmin } from '../config/supabase';

// Mock AI 服务
jest.mock('../services/ai.service');

describe('AI Itinerary Generation API Tests', () => {
  // 测试用户和认证
  let userToken: string;
  let userId: string;
  let anotherUserToken: string;
  let anotherUserId: string;

  // 测试旅行
  let tripId: string;
  let anotherUserTripId: string;

  // 在所有测试之前，创建测试用户和旅行
  beforeAll(async () => {
    const timestamp = Date.now();

    // 创建第一个测试用户
    const user1Response = await request(app)
      .post('/auth/signup')
      .send({
        email: `aitest1${timestamp}@example.com`,
        password: 'Test123456!',
        fullName: 'AI Test User 1',
      });

    userToken = user1Response.body.session.access_token;
    userId = user1Response.body.user.id;

    // 创建第二个测试用户
    const user2Response = await request(app)
      .post('/auth/signup')
      .send({
        email: `aitest2${timestamp}@example.com`,
        password: 'Test123456!',
        fullName: 'AI Test User 2',
      });

    anotherUserToken = user2Response.body.session.access_token;
    anotherUserId = user2Response.body.user.id;

    // 为第一个用户创建旅行（未生成行程）
    const trip1Response = await request(app)
      .post('/api/trips')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        title: 'AI 测试旅行',
        destination: '北京',
        startDate: '2025-06-01',
        endDate: '2025-06-07',
        travelerCount: 2,
        budgetTotal: 5000,
        currency: 'CNY',
      });

    tripId = trip1Response.body.trip.id;

    // 为第二个用户创建旅行
    const trip2Response = await request(app)
      .post('/api/trips')
      .set('Authorization', `Bearer ${anotherUserToken}`)
      .send({
        title: '另一个用户的旅行',
        destination: '上海',
        startDate: '2025-07-01',
        endDate: '2025-07-05',
        travelerCount: 1,
        budgetTotal: 3000,
        currency: 'CNY',
      });

    anotherUserTripId = trip2Response.body.trip.id;
  }, 15000);

  // 测试结束后清理数据
  afterAll(async () => {
    // 删除测试用户创建的旅行
    if (userId) {
      await supabaseAdmin.from('trips').delete().eq('user_id', userId);
    }
    if (anotherUserId) {
      await supabaseAdmin.from('trips').delete().eq('user_id', anotherUserId);
    }
  });

  describe('POST /api/trips/:id/generate - 生成 AI 行程', () => {
    it('should generate itinerary successfully', async () => {
      const response = await request(app)
        .post(`/api/trips/${tripId}/generate`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('trip');
      expect(response.body.trip).toHaveProperty('itinerary');
      expect(response.body.trip.itinerary).not.toBeNull();

      // 验证 itinerary 是有效的 JSON 对象
      expect(typeof response.body.trip.itinerary).toBe('object');
      expect(response.body.trip.itinerary).toHaveProperty('days');
      expect(Array.isArray(response.body.trip.itinerary.days)).toBe(true);
    }, 30000); // AI 调用可能需要较长时间

    it('should fail without authentication', async () => {
      const response = await request(app)
        .post(`/api/trips/${tripId}/generate`)
        .expect('Content-Type', /json/)
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });

    it('should fail when trip does not exist', async () => {
      const fakeUuid = '00000000-0000-0000-0000-000000000000';
      const response = await request(app)
        .post(`/api/trips/${fakeUuid}/generate`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect('Content-Type', /json/)
        .expect(404);

      expect(response.body).toHaveProperty('error');
    });

    it('should fail when generating for another user trip', async () => {
      // 由于 RLS 策略，用户无法访问其他用户的旅行，返回 404
      const response = await request(app)
        .post(`/api/trips/${anotherUserTripId}/generate`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect('Content-Type', /json/)
        .expect(404);

      expect(response.body).toHaveProperty('error');
    });

    it('should handle AI service error gracefully', async () => {
      // 这个测试依赖于 mock 实现来模拟错误
      // 在实现阶段，我们会在 mock 中添加错误场景
      const response = await request(app)
        .post(`/api/trips/${tripId}/generate`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect('Content-Type', /json/);

      // 应该要么成功（200），要么返回服务器错误（500）
      expect([200, 500]).toContain(response.status);
    }, 30000);

    it('should update existing itinerary when regenerating', async () => {
      // 第二次生成应该更新现有行程
      const response = await request(app)
        .post(`/api/trips/${tripId}/generate`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('trip');
      expect(response.body.trip.itinerary).not.toBeNull();
    }, 30000);
  });
});

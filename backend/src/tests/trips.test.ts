/**
 * 旅行计划 CRUD API 测试
 *
 * TDD 开发 - 先写测试，后写实现
 *
 * 测试端点：
 * - POST /api/trips - 创建旅行计划
 * - GET /api/trips - 获取用户旅行列表
 * - GET /api/trips/:id - 获取旅行详情
 * - PUT /api/trips/:id - 更新旅行计划
 * - DELETE /api/trips/:id - 删除旅行计划
 */

import request from 'supertest';
import { app } from '../app';
import { supabaseAdmin } from '../config/supabase';

describe('Trips CRUD API Tests', () => {
  // 测试用户和认证
  let userToken: string;
  let userId: string;
  let anotherUserToken: string;
  let anotherUserId: string;

  // 测试旅行计划
  let createdTripId: string;

  // 在所有测试之前，创建测试用户并获取 token
  beforeAll(async () => {
    const timestamp = Date.now();

    // 创建第一个测试用户
    const user1Response = await request(app)
      .post('/auth/signup')
      .send({
        email: `triptest1${timestamp}@example.com`,
        password: 'Test123456!',
        fullName: 'Trip Test User 1',
      });

    userToken = user1Response.body.session.access_token;
    userId = user1Response.body.user.id;

    // 创建第二个测试用户（用于测试权限）
    const user2Response = await request(app)
      .post('/auth/signup')
      .send({
        email: `triptest2${timestamp}@example.com`,
        password: 'Test123456!',
        fullName: 'Trip Test User 2',
      });

    anotherUserToken = user2Response.body.session.access_token;
    anotherUserId = user2Response.body.user.id;
  });

  // 测试结束后清理数据
  afterAll(async () => {
    // 删除测试用户创建的旅行计划
    if (userId) {
      await supabaseAdmin.from('trips').delete().eq('user_id', userId);
    }
    if (anotherUserId) {
      await supabaseAdmin.from('trips').delete().eq('user_id', anotherUserId);
    }
  });

  describe('POST /api/trips - 创建旅行计划', () => {
    const validTrip = {
      title: '北京文化之旅',
      destination: '北京',
      startDate: '2025-06-01',
      endDate: '2025-06-07',
      travelerCount: 2,
      budgetTotal: 5000,
      currency: 'CNY',
    };

    it('should create a new trip successfully', async () => {
      const response = await request(app)
        .post('/api/trips')
        .set('Authorization', `Bearer ${userToken}`)
        .send(validTrip)
        .expect('Content-Type', /json/)
        .expect(201);

      expect(response.body).toHaveProperty('trip');
      expect(response.body.trip).toHaveProperty('id');
      expect(response.body.trip.title).toBe(validTrip.title);
      expect(response.body.trip.destination).toBe(validTrip.destination);
      expect(response.body.trip.user_id).toBe(userId);
      expect(response.body.trip.status).toBe('planning');

      // 保存 trip ID 用于后续测试
      createdTripId = response.body.trip.id;
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .post('/api/trips')
        .send(validTrip)
        .expect('Content-Type', /json/)
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });

    it('should fail with missing required fields', async () => {
      const response = await request(app)
        .post('/api/trips')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          title: '测试旅行',
          // 缺少其他必填字段
        })
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should fail with invalid date range', async () => {
      const response = await request(app)
        .post('/api/trips')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          ...validTrip,
          startDate: '2025-06-10',
          endDate: '2025-06-05', // 结束日期早于开始日期
        })
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should fail with invalid traveler count', async () => {
      const response = await request(app)
        .post('/api/trips')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          ...validTrip,
          travelerCount: 0, // 无效的旅行人数
        })
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /api/trips - 获取旅行列表', () => {
    it('should get user trips successfully', async () => {
      const response = await request(app)
        .get('/api/trips')
        .set('Authorization', `Bearer ${userToken}`)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('trips');
      expect(Array.isArray(response.body.trips)).toBe(true);
      expect(response.body.trips.length).toBeGreaterThan(0);

      // 验证返回的都是当前用户的旅行
      response.body.trips.forEach((trip: any) => {
        expect(trip.user_id).toBe(userId);
      });
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .get('/api/trips')
        .expect('Content-Type', /json/)
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });

    it('should not return other users trips', async () => {
      // 创建另一个用户的旅行
      await request(app)
        .post('/api/trips')
        .set('Authorization', `Bearer ${anotherUserToken}`)
        .send({
          title: '另一个用户的旅行',
          destination: '上海',
          startDate: '2025-07-01',
          endDate: '2025-07-05',
          travelerCount: 1,
          budgetTotal: 3000,
        });

      // 获取第一个用户的旅行列表
      const response = await request(app)
        .get('/api/trips')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      // 不应该包含其他用户的旅行
      const hasOtherUserTrip = response.body.trips.some(
        (trip: any) => trip.user_id === anotherUserId
      );
      expect(hasOtherUserTrip).toBe(false);
    });
  });

  describe('GET /api/trips/:id - 获取旅行详情', () => {
    it('should get trip details successfully', async () => {
      const response = await request(app)
        .get(`/api/trips/${createdTripId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('trip');
      expect(response.body.trip.id).toBe(createdTripId);
      expect(response.body.trip.user_id).toBe(userId);
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .get(`/api/trips/${createdTripId}`)
        .expect('Content-Type', /json/)
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });

    it('should fail when trip does not exist', async () => {
      const fakeUuid = '00000000-0000-0000-0000-000000000000';
      const response = await request(app)
        .get(`/api/trips/${fakeUuid}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect('Content-Type', /json/)
        .expect(404);

      expect(response.body).toHaveProperty('error');
    });

    it('should fail when accessing another user trip', async () => {
      // 尝试用第二个用户的 token 访问第一个用户的旅行
      // 由于 RLS 策略，用户无法查看其他用户的旅行，返回 404
      const response = await request(app)
        .get(`/api/trips/${createdTripId}`)
        .set('Authorization', `Bearer ${anotherUserToken}`)
        .expect('Content-Type', /json/)
        .expect(404);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('PUT /api/trips/:id - 更新旅行计划', () => {
    it('should update trip successfully', async () => {
      const updatedData = {
        title: '北京深度游（已更新）',
        budgetTotal: 6000,
        status: 'confirmed',
      };

      const response = await request(app)
        .put(`/api/trips/${createdTripId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send(updatedData)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('trip');
      expect(response.body.trip.title).toBe(updatedData.title);
      expect(response.body.trip.budget_total).toBe(updatedData.budgetTotal);
      expect(response.body.trip.status).toBe(updatedData.status);
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .put(`/api/trips/${createdTripId}`)
        .send({ title: '测试更新' })
        .expect('Content-Type', /json/)
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });

    it('should fail when trip does not exist', async () => {
      const fakeUuid = '00000000-0000-0000-0000-000000000000';
      const response = await request(app)
        .put(`/api/trips/${fakeUuid}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ title: '测试更新' })
        .expect('Content-Type', /json/)
        .expect(404);

      expect(response.body).toHaveProperty('error');
    });

    it('should fail when updating another user trip', async () => {
      // 由于 RLS 策略，用户无法访问其他用户的旅行，返回 404
      const response = await request(app)
        .put(`/api/trips/${createdTripId}`)
        .set('Authorization', `Bearer ${anotherUserToken}`)
        .send({ title: '尝试更新别人的旅行' })
        .expect('Content-Type', /json/)
        .expect(404);

      expect(response.body).toHaveProperty('error');
    });

    it('should fail with invalid date range', async () => {
      const response = await request(app)
        .put(`/api/trips/${createdTripId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          startDate: '2025-06-10',
          endDate: '2025-06-05', // 结束日期早于开始日期
        })
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('DELETE /api/trips/:id - 删除旅行计划', () => {
    it('should fail without authentication', async () => {
      const response = await request(app)
        .delete(`/api/trips/${createdTripId}`)
        .expect('Content-Type', /json/)
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });

    it('should fail when trip does not exist', async () => {
      const fakeUuid = '00000000-0000-0000-0000-000000000000';
      const response = await request(app)
        .delete(`/api/trips/${fakeUuid}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect('Content-Type', /json/)
        .expect(404);

      expect(response.body).toHaveProperty('error');
    });

    it('should fail when deleting another user trip', async () => {
      // 由于 RLS 策略，用户无法访问其他用户的旅行，返回 404
      const response = await request(app)
        .delete(`/api/trips/${createdTripId}`)
        .set('Authorization', `Bearer ${anotherUserToken}`)
        .expect('Content-Type', /json/)
        .expect(404);

      expect(response.body).toHaveProperty('error');
    });

    it('should delete trip successfully', async () => {
      const response = await request(app)
        .delete(`/api/trips/${createdTripId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('message');

      // 验证旅行已被删除
      const getResponse = await request(app)
        .get(`/api/trips/${createdTripId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(404);

      expect(getResponse.body).toHaveProperty('error');
    }, 10000); // 增加超时时间到 10 秒（需要两次 API 调用）
  });
});

/**
 * 预算管理 API 测试
 *
 * TDD 开发 - 先写测试，后写实现
 *
 * 测试端点：
 * - POST /api/trips/:id/expenses - 添加支出
 * - GET /api/trips/:id/expenses - 获取支出列表
 * - PUT /api/trips/:id/expenses/:expenseId - 更新支出
 * - DELETE /api/trips/:id/expenses/:expenseId - 删除支出
 * - GET /api/trips/:id/budget - 获取预算摘要
 */

import request from 'supertest';
import { app } from '../app';
import { supabaseAdmin } from '../config/supabase';

describe('Expenses and Budget API Tests', () => {
  // 测试用户和认证
  let userToken: string;
  let userId: string;
  let anotherUserToken: string;
  let anotherUserId: string;

  // 测试旅行和支出
  let tripId: string;
  let anotherUserTripId: string;
  let expenseId: string;

  // 在所有测试之前，创建测试用户、旅行
  beforeAll(async () => {
    const timestamp = Date.now();

    // 创建第一个测试用户
    const user1Response = await request(app)
      .post('/auth/signup')
      .send({
        email: `expensetest1${timestamp}@example.com`,
        password: 'Test123456!',
        fullName: 'Expense Test User 1',
      });

    userToken = user1Response.body.session.access_token;
    userId = user1Response.body.user.id;

    // 创建第二个测试用户
    const user2Response = await request(app)
      .post('/auth/signup')
      .send({
        email: `expensetest2${timestamp}@example.com`,
        password: 'Test123456!',
        fullName: 'Expense Test User 2',
      });

    anotherUserToken = user2Response.body.session.access_token;
    anotherUserId = user2Response.body.user.id;

    // 为第一个用户创建旅行
    const trip1Response = await request(app)
      .post('/api/trips')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        title: '预算测试旅行',
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
  }, 15000); // 增加超时时间到 15 秒（需要创建 2 个用户和 2 个旅行）

  // 测试结束后清理数据
  afterAll(async () => {
    // 删除测试用户创建的旅行（会级联删除支出）
    if (userId) {
      await supabaseAdmin.from('trips').delete().eq('user_id', userId);
    }
    if (anotherUserId) {
      await supabaseAdmin.from('trips').delete().eq('user_id', anotherUserId);
    }
  });

  describe('POST /api/trips/:id/expenses - 添加支出', () => {
    const validExpense = {
      category: 'accommodation',
      amount: 500,
      currency: 'CNY',
      description: '酒店住宿',
      expenseDate: '2025-06-02',
    };

    it('should add expense successfully', async () => {
      const response = await request(app)
        .post(`/api/trips/${tripId}/expenses`)
        .set('Authorization', `Bearer ${userToken}`)
        .send(validExpense)
        .expect('Content-Type', /json/)
        .expect(201);

      expect(response.body).toHaveProperty('expense');
      expect(response.body.expense).toHaveProperty('id');
      expect(response.body.expense.trip_id).toBe(tripId);
      expect(response.body.expense.category).toBe(validExpense.category);
      expect(response.body.expense.amount).toBe(validExpense.amount);
      expect(response.body.expense.description).toBe(validExpense.description);

      // 保存 expense ID 用于后续测试
      expenseId = response.body.expense.id;
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .post(`/api/trips/${tripId}/expenses`)
        .send(validExpense)
        .expect('Content-Type', /json/)
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });

    it('should fail with missing required fields', async () => {
      const response = await request(app)
        .post(`/api/trips/${tripId}/expenses`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          category: 'food',
          // 缺少 amount 和 expenseDate
        })
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should fail with invalid amount', async () => {
      const response = await request(app)
        .post(`/api/trips/${tripId}/expenses`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          ...validExpense,
          amount: 0, // 金额必须大于 0
        })
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should fail when trip does not exist', async () => {
      const fakeUuid = '00000000-0000-0000-0000-000000000000';
      const response = await request(app)
        .post(`/api/trips/${fakeUuid}/expenses`)
        .set('Authorization', `Bearer ${userToken}`)
        .send(validExpense)
        .expect('Content-Type', /json/)
        .expect(404);

      expect(response.body).toHaveProperty('error');
    });

    it('should fail when adding expense to another user trip', async () => {
      // 由于 RLS 策略，用户无法访问其他用户的旅行，返回 404
      const response = await request(app)
        .post(`/api/trips/${anotherUserTripId}/expenses`)
        .set('Authorization', `Bearer ${userToken}`)
        .send(validExpense)
        .expect('Content-Type', /json/)
        .expect(404);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /api/trips/:id/expenses - 获取支出列表', () => {
    it('should get expenses list successfully', async () => {
      const response = await request(app)
        .get(`/api/trips/${tripId}/expenses`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('expenses');
      expect(Array.isArray(response.body.expenses)).toBe(true);
      expect(response.body.expenses.length).toBeGreaterThan(0);

      // 验证返回的支出都属于这个旅行
      response.body.expenses.forEach((expense: any) => {
        expect(expense.trip_id).toBe(tripId);
      });
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .get(`/api/trips/${tripId}/expenses`)
        .expect('Content-Type', /json/)
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });

    it('should fail when trip does not exist', async () => {
      const fakeUuid = '00000000-0000-0000-0000-000000000000';
      const response = await request(app)
        .get(`/api/trips/${fakeUuid}/expenses`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect('Content-Type', /json/)
        .expect(404);

      expect(response.body).toHaveProperty('error');
    });

    it('should fail when accessing another user trip expenses', async () => {
      // 由于 RLS 策略，用户无法访问其他用户的旅行，返回 404
      const response = await request(app)
        .get(`/api/trips/${anotherUserTripId}/expenses`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect('Content-Type', /json/)
        .expect(404);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('PUT /api/trips/:id/expenses/:expenseId - 更新支出', () => {
    it('should update expense successfully', async () => {
      const updatedData = {
        amount: 600,
        description: '酒店住宿（已更新）',
      };

      const response = await request(app)
        .put(`/api/trips/${tripId}/expenses/${expenseId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send(updatedData)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('expense');
      expect(response.body.expense.amount).toBe(updatedData.amount);
      expect(response.body.expense.description).toBe(updatedData.description);
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .put(`/api/trips/${tripId}/expenses/${expenseId}`)
        .send({ amount: 700 })
        .expect('Content-Type', /json/)
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });

    it('should fail with invalid amount', async () => {
      const response = await request(app)
        .put(`/api/trips/${tripId}/expenses/${expenseId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ amount: -100 })
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should fail when expense does not exist', async () => {
      const fakeUuid = '00000000-0000-0000-0000-000000000000';
      const response = await request(app)
        .put(`/api/trips/${tripId}/expenses/${fakeUuid}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ amount: 700 })
        .expect('Content-Type', /json/)
        .expect(404);

      expect(response.body).toHaveProperty('error');
    });

    it('should fail when updating another user trip expense', async () => {
      // 创建另一个用户的支出
      const expense2Response = await request(app)
        .post(`/api/trips/${anotherUserTripId}/expenses`)
        .set('Authorization', `Bearer ${anotherUserToken}`)
        .send({
          category: 'food',
          amount: 100,
          currency: 'CNY',
          expenseDate: '2025-07-02',
        });

      const expense2Id = expense2Response.body.expense.id;

      // 尝试用第一个用户的 token 更新第二个用户的支出
      // 由于 RLS 策略，无法访问，返回 404
      const response = await request(app)
        .put(`/api/trips/${anotherUserTripId}/expenses/${expense2Id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ amount: 200 })
        .expect('Content-Type', /json/)
        .expect(404);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('DELETE /api/trips/:id/expenses/:expenseId - 删除支出', () => {
    let toDeleteExpenseId: string;

    beforeAll(async () => {
      // 创建一个用于删除测试的支出
      const response = await request(app)
        .post(`/api/trips/${tripId}/expenses`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          category: 'transport',
          amount: 200,
          currency: 'CNY',
          description: '出租车费用',
          expenseDate: '2025-06-03',
        });

      toDeleteExpenseId = response.body.expense.id;
    }, 10000); // 增加超时时间

    it('should fail without authentication', async () => {
      const response = await request(app)
        .delete(`/api/trips/${tripId}/expenses/${toDeleteExpenseId}`)
        .expect('Content-Type', /json/)
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });

    it('should fail when expense does not exist', async () => {
      const fakeUuid = '00000000-0000-0000-0000-000000000000';
      const response = await request(app)
        .delete(`/api/trips/${tripId}/expenses/${fakeUuid}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect('Content-Type', /json/)
        .expect(404);

      expect(response.body).toHaveProperty('error');
    });

    it('should fail when deleting another user trip expense', async () => {
      // 创建另一个用户的支出
      const expense2Response = await request(app)
        .post(`/api/trips/${anotherUserTripId}/expenses`)
        .set('Authorization', `Bearer ${anotherUserToken}`)
        .send({
          category: 'entertainment',
          amount: 150,
          currency: 'CNY',
          expenseDate: '2025-07-03',
        });

      const expense2Id = expense2Response.body.expense.id;

      // 尝试用第一个用户的 token 删除第二个用户的支出
      // 由于 RLS 策略，无法访问，返回 404
      const response = await request(app)
        .delete(`/api/trips/${anotherUserTripId}/expenses/${expense2Id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect('Content-Type', /json/)
        .expect(404);

      expect(response.body).toHaveProperty('error');
    });

    it('should delete expense successfully', async () => {
      const response = await request(app)
        .delete(`/api/trips/${tripId}/expenses/${toDeleteExpenseId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('message');

      // 验证支出已被删除
      const expenses = await request(app)
        .get(`/api/trips/${tripId}/expenses`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      const hasDeletedExpense = expenses.body.expenses.some(
        (expense: any) => expense.id === toDeleteExpenseId
      );
      expect(hasDeletedExpense).toBe(false);
    }, 10000);
  });

  describe('GET /api/trips/:id/budget - 获取预算摘要', () => {
    it('should get budget summary successfully', async () => {
      const response = await request(app)
        .get(`/api/trips/${tripId}/budget`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('budget');
      expect(response.body.budget).toHaveProperty('total');
      expect(response.body.budget).toHaveProperty('spent');
      expect(response.body.budget).toHaveProperty('remaining');
      expect(response.body.budget).toHaveProperty('currency');
      expect(response.body.budget).toHaveProperty('byCategory');

      // 验证数值
      expect(response.body.budget.total).toBe(5000);
      expect(response.body.budget.spent).toBeGreaterThan(0);
      expect(response.body.budget.remaining).toBeLessThan(5000);
      expect(response.body.budget.currency).toBe('CNY');
      expect(Array.isArray(response.body.budget.byCategory)).toBe(true);
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .get(`/api/trips/${tripId}/budget`)
        .expect('Content-Type', /json/)
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });

    it('should fail when trip does not exist', async () => {
      const fakeUuid = '00000000-0000-0000-0000-000000000000';
      const response = await request(app)
        .get(`/api/trips/${fakeUuid}/budget`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect('Content-Type', /json/)
        .expect(404);

      expect(response.body).toHaveProperty('error');
    });

    it('should fail when accessing another user trip budget', async () => {
      // 由于 RLS 策略，用户无法访问其他用户的旅行，返回 404
      const response = await request(app)
        .get(`/api/trips/${anotherUserTripId}/budget`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect('Content-Type', /json/)
        .expect(404);

      expect(response.body).toHaveProperty('error');
    });
  });
});

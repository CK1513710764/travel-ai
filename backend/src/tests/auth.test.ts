/**
 * 用户认证 API 测试
 *
 * TDD 开发 - 先写测试，后写实现
 *
 * 测试端点：
 * - POST /auth/signup - 用户注册
 * - POST /auth/login - 用户登录
 * - GET /auth/me - 获取当前用户信息
 * - POST /auth/logout - 用户登出
 */

import request from 'supertest';
import { app } from '../app';

describe('Authentication API Tests', () => {
  // 生成唯一的测试邮箱（避免冲突）
  const timestamp = Date.now();
  const testUser = {
    email: `test${timestamp}@example.com`,
    password: 'Test123456!',
    fullName: 'Test User',
  };

  let accessToken: string;
  let refreshToken: string;

  describe('POST /auth/signup - 用户注册', () => {
    it('should register a new user successfully', async () => {
      const response = await request(app)
        .post('/auth/signup')
        .send(testUser)
        .expect('Content-Type', /json/)
        .expect(201);

      expect(response.body).toHaveProperty('user');
      expect(response.body).toHaveProperty('session');
      expect(response.body.user).toHaveProperty('email', testUser.email);
      expect(response.body.session).toHaveProperty('access_token');
      expect(response.body.session).toHaveProperty('refresh_token');

      // 保存 token 用于后续测试
      accessToken = response.body.session.access_token;
      refreshToken = response.body.session.refresh_token;
    });

    it('should fail with missing email', async () => {
      const response = await request(app)
        .post('/auth/signup')
        .send({
          password: testUser.password,
          fullName: testUser.fullName,
        })
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should fail with missing password', async () => {
      const response = await request(app)
        .post('/auth/signup')
        .send({
          email: testUser.email,
          fullName: testUser.fullName,
        })
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should fail with invalid email format', async () => {
      const response = await request(app)
        .post('/auth/signup')
        .send({
          email: 'invalid-email',
          password: testUser.password,
          fullName: testUser.fullName,
        })
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should fail with weak password', async () => {
      const response = await request(app)
        .post('/auth/signup')
        .send({
          email: 'another@example.com',
          password: '123', // 弱密码
          fullName: testUser.fullName,
        })
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should fail when email already exists', async () => {
      // 第二次使用相同的 email 注册
      const response = await request(app)
        .post('/auth/signup')
        .send(testUser)
        .expect('Content-Type', /json/)
        .expect(409);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('already');
    });
  });

  describe('POST /auth/login - 用户登录', () => {
    it('should login successfully with correct credentials', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        })
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('user');
      expect(response.body).toHaveProperty('session');
      expect(response.body.user.email).toBe(testUser.email);
      expect(response.body.session).toHaveProperty('access_token');
      expect(response.body.session).toHaveProperty('refresh_token');

      // 更新 token
      accessToken = response.body.session.access_token;
    });

    it('should fail with incorrect password', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          email: testUser.email,
          password: 'WrongPassword123!',
        })
        .expect('Content-Type', /json/)
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });

    it('should fail with non-existent email', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: testUser.password,
        })
        .expect('Content-Type', /json/)
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });

    it('should fail with missing email', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          password: testUser.password,
        })
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should fail with missing password', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          email: testUser.email,
        })
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /auth/me - 获取当前用户', () => {
    it('should get current user with valid token', async () => {
      const response = await request(app)
        .get('/auth/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('email', testUser.email);
      expect(response.body.user).toHaveProperty('id');
    });

    it('should fail without token', async () => {
      const response = await request(app)
        .get('/auth/me')
        .expect('Content-Type', /json/)
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });

    it('should fail with invalid token', async () => {
      const response = await request(app)
        .get('/auth/me')
        .set('Authorization', 'Bearer invalid-token-here')
        .expect('Content-Type', /json/)
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });

    it('should fail with malformed Authorization header', async () => {
      const response = await request(app)
        .get('/auth/me')
        .set('Authorization', 'InvalidFormat')
        .expect('Content-Type', /json/)
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /auth/logout - 用户登出', () => {
    it('should logout successfully with valid token', async () => {
      const response = await request(app)
        .post('/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('success');
    });

    it('should fail logout without token', async () => {
      const response = await request(app)
        .post('/auth/logout')
        .expect('Content-Type', /json/)
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });

    it('should successfully logout (token remains valid until expiry)', async () => {
      // 注意：由于使用 JWT，token 在登出后仍然有效直到过期
      // 这是 JWT 的标准行为，除非实现 token 黑名单机制
      // 在实际应用中，客户端会在 logout 后删除本地存储的 token

      // 验证 token 仍然有效（这是预期的 JWT 行为）
      const response = await request(app)
        .get('/auth/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('user');

      // 在实际应用中，客户端会删除 token，从而无法再发送请求
    });
  });
});

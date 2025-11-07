import { Router } from 'express';
import {
  createTrip,
  getTrips,
  getTripById,
  updateTrip,
  deleteTrip,
  generateTripItinerary,
  parseVoiceText,
} from '../controllers/trips.controller';
import { authenticateJWT } from '../middleware/auth';
import { validateCreateTrip, validateUpdateTrip } from '../middleware/validation';
import expensesRouter, { getBudgetSummary } from './expenses';

const router = Router();

/**
 * @route   POST /api/trips/parse-voice
 * @desc    使用 AI 解析语音文本
 * @access  Public (不需要 JWT - 在创建旅行前调用)
 */
router.post('/parse-voice', parseVoiceText);

/**
 * @route   POST /api/trips
 * @desc    创建旅行计划
 * @access  Private (需要 JWT)
 */
router.post('/', authenticateJWT, validateCreateTrip, createTrip);

/**
 * @route   GET /api/trips
 * @desc    获取用户的旅行列表
 * @access  Private (需要 JWT)
 */
router.get('/', authenticateJWT, getTrips);

/**
 * @route   GET /api/trips/:id
 * @desc    获取旅行详情
 * @access  Private (需要 JWT)
 */
router.get('/:id', authenticateJWT, getTripById);

/**
 * @route   PUT /api/trips/:id
 * @desc    更新旅行计划
 * @access  Private (需要 JWT)
 */
router.put('/:id', authenticateJWT, validateUpdateTrip, updateTrip);

/**
 * @route   DELETE /api/trips/:id
 * @desc    删除旅行计划
 * @access  Private (需要 JWT)
 */
router.delete('/:id', authenticateJWT, deleteTrip);

/**
 * @route   POST /api/trips/:id/generate
 * @desc    生成 AI 行程
 * @access  Private (需要 JWT)
 */
router.post('/:id/generate', authenticateJWT, generateTripItinerary);

/**
 * @route   GET /api/trips/:id/budget
 * @desc    获取预算摘要
 * @access  Private (需要 JWT)
 */
router.get('/:id/budget', authenticateJWT, getBudgetSummary);

/**
 * 挂载支出管理路由
 * /api/trips/:id/expenses - 支出 CRUD
 */
router.use('/:id/expenses', expensesRouter);

export default router;

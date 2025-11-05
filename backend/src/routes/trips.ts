import { Router } from 'express';
import {
  createTrip,
  getTrips,
  getTripById,
  updateTrip,
  deleteTrip,
} from '../controllers/trips.controller';
import { authenticateJWT } from '../middleware/auth';
import { validateCreateTrip, validateUpdateTrip } from '../middleware/validation';

const router = Router();

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

export default router;

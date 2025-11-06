import { Router } from 'express';
import {
  addExpense,
  getExpenses,
  updateExpense,
  deleteExpense,
  getBudgetSummary,
} from '../controllers/expenses.controller';
import { authenticateJWT } from '../middleware/auth';
import { validateAddExpense, validateUpdateExpense } from '../middleware/validation';

const router = Router({ mergeParams: true }); // mergeParams 允许访问父路由的参数

/**
 * @route   POST /api/trips/:id/expenses
 * @desc    添加支出
 * @access  Private (需要 JWT)
 */
router.post('/', authenticateJWT, validateAddExpense, addExpense);

/**
 * @route   GET /api/trips/:id/expenses
 * @desc    获取支出列表
 * @access  Private (需要 JWT)
 */
router.get('/', authenticateJWT, getExpenses);

/**
 * @route   PUT /api/trips/:id/expenses/:expenseId
 * @desc    更新支出
 * @access  Private (需要 JWT)
 */
router.put('/:expenseId', authenticateJWT, validateUpdateExpense, updateExpense);

/**
 * @route   DELETE /api/trips/:id/expenses/:expenseId
 * @desc    删除支出
 * @access  Private (需要 JWT)
 */
router.delete('/:expenseId', authenticateJWT, deleteExpense);

export default router;

// 导出 budget 处理器，用于单独路由
export { getBudgetSummary };

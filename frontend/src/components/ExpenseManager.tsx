import { useState, useEffect } from 'react';
import { expensesAPI, tripsAPI } from '../services/api';
import type { Expense, BudgetSummary } from '../types';
import './ExpenseManager.css';

interface ExpenseManagerProps {
  tripId: string;
}

const ExpenseManager: React.FC<ExpenseManagerProps> = ({ tripId }) => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [budget, setBudget] = useState<BudgetSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);

  // 新增费用表单
  const [newExpense, setNewExpense] = useState({
    category: '',
    amount: '',
    description: '',
    expenseDate: new Date().toISOString().split('T')[0],
  });

  // 加载费用列表和预算
  useEffect(() => {
    loadExpenses();
    loadBudget();
  }, [tripId]);

  const loadExpenses = async () => {
    try {
      const { expenses: data } = await expensesAPI.getExpenses(tripId);
      setExpenses(data);
    } catch (err: any) {
      console.error('加载费用失败:', err);
    }
  };

  const loadBudget = async () => {
    try {
      const { budget: data } = await tripsAPI.getBudget(tripId);
      setBudget(data);
    } catch (err: any) {
      console.error('加载预算失败:', err);
    }
  };

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await expensesAPI.addExpense(tripId, {
        category: newExpense.category,
        amount: parseFloat(newExpense.amount),
        currency: 'CNY',
        description: newExpense.description,
        expenseDate: newExpense.expenseDate,
      });

      // 重置表单
      setNewExpense({
        category: '',
        amount: '',
        description: '',
        expenseDate: new Date().toISOString().split('T')[0],
      });
      setShowForm(false);

      // 重新加载数据
      await loadExpenses();
      await loadBudget();
    } catch (err: any) {
      setError(err.response?.data?.error || '添加失败');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteExpense = async (expenseId: string) => {
    if (!confirm('确定要删除这条消费记录吗？')) return;

    try {
      await expensesAPI.deleteExpense(tripId, expenseId);
      await loadExpenses();
      await loadBudget();
    } catch (err: any) {
      setError(err.response?.data?.error || '删除失败');
    }
  };

  // 计算预算使用百分比
  const budgetPercentage = budget && budget.total > 0
    ? Math.min(((budget.spent || 0) / budget.total) * 100, 100)
    : 0;

  const categories = [
    '交通', '住宿', '餐饮', '门票', '购物', '娱乐', '其他'
  ];

  return (
    <div className="expense-manager">
      <div className="expense-header">
        <h3>💰 费用管理</h3>
        <button
          onClick={() => setShowForm(!showForm)}
          className="btn-add-expense"
        >
          {showForm ? '取消' : '+ 添加消费'}
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {/* 预算概览 */}
      {budget && (
        <div className="budget-overview">
          <div className="budget-stats">
            <div className="stat-item">
              <span className="stat-label">总预算</span>
              <span className="stat-value">¥{(budget.total || 0).toLocaleString()}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">已花费</span>
              <span className="stat-value spent">¥{(budget.spent || 0).toLocaleString()}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">剩余</span>
              <span className={`stat-value ${(budget.remaining || 0) < 0 ? 'over-budget' : ''}`}>
                ¥{(budget.remaining || 0).toLocaleString()}
              </span>
            </div>
          </div>

          <div className="budget-progress">
            <div className="progress-bar">
              <div
                className={`progress-fill ${budgetPercentage > 90 ? 'warning' : ''}`}
                style={{ width: `${budgetPercentage}%` }}
              ></div>
            </div>
            <span className="progress-text">{budgetPercentage.toFixed(1)}% 已使用</span>
          </div>

          {budget.byCategory && budget.byCategory.length > 0 && (
            <div className="category-breakdown">
              <h4>分类统计</h4>
              <div className="category-list">
                {budget.byCategory.map((cat: any, index: number) => (
                  <div key={index} className="category-item">
                    <span className="category-name">{cat.category || '未分类'}</span>
                    <span className="category-amount">
                      ¥{(cat.total || 0).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 添加费用表单 */}
      {showForm && (
        <form onSubmit={handleAddExpense} className="expense-form">
          <div className="form-row">
            <div className="form-group">
              <label>分类 *</label>
              <select
                value={newExpense.category}
                onChange={(e) => setNewExpense({ ...newExpense, category: e.target.value })}
                required
              >
                <option value="">请选择</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>金额 (¥) *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={newExpense.amount}
                onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
                placeholder="0.00"
                required
              />
            </div>

            <div className="form-group">
              <label>日期 *</label>
              <input
                type="date"
                value={newExpense.expenseDate}
                onChange={(e) => setNewExpense({ ...newExpense, expenseDate: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>说明</label>
            <input
              type="text"
              value={newExpense.description}
              onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
              placeholder="例如：午餐、地铁票"
            />
          </div>

          <button type="submit" className="btn-submit" disabled={loading}>
            {loading ? '添加中...' : '添加'}
          </button>
        </form>
      )}

      {/* 费用列表 */}
      <div className="expenses-list">
        <h4>消费记录 ({expenses.length})</h4>
        {expenses.length === 0 ? (
          <p className="no-expenses">暂无消费记录</p>
        ) : (
          <div className="expense-items">
            {expenses.map((expense) => (
              <div key={expense.id} className="expense-item">
                <div className="expense-info">
                  <div className="expense-category">{expense.category}</div>
                  <div className="expense-description">{expense.description || '无说明'}</div>
                  <div className="expense-date">
                    {new Date(expense.expense_date).toLocaleDateString('zh-CN')}
                  </div>
                </div>
                <div className="expense-actions">
                  <span className="expense-amount">¥{(expense.amount || 0).toLocaleString()}</span>
                  <button
                    onClick={() => handleDeleteExpense(expense.id)}
                    className="btn-delete"
                    title="删除"
                  >
                    ×
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ExpenseManager;

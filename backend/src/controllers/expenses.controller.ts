import { Request, Response } from 'express';
import { getSupabaseClient } from '../config/supabase';

/**
 * 预算管理控制器
 * 处理支出的 CRUD 操作和预算统计
 */

/**
 * POST /api/trips/:id/expenses - 添加支出
 */
export const addExpense = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { id: tripId } = req.params;
    const {
      category,
      amount,
      currency,
      description,
      expenseDate,
    } = req.body;

    // 使用用户的 token 创建 Supabase 客户端
    const authHeader = req.headers.authorization;
    const userSupabase = getSupabaseClient(authHeader);

    // 先检查旅行是否存在且属于当前用户
    const { data: trip, error: tripError } = await userSupabase
      .from('trips')
      .select('id, user_id')
      .eq('id', tripId)
      .single();

    if (tripError || !trip) {
      return res.status(404).json({
        error: 'Trip not found',
      });
    }

    if (trip.user_id !== user.id) {
      return res.status(403).json({
        error: 'Access denied',
      });
    }

    // 插入支出记录（包含 user_id 以满足 RLS 策略）
    const { data, error } = await userSupabase
      .from('expenses')
      .insert({
        trip_id: tripId,
        user_id: user.id,
        category,
        amount,
        currency: currency || 'CNY',
        description,
        expense_date: expenseDate,
      })
      .select()
      .single();

    if (error) {
      console.error('Add expense error:', error);
      return res.status(400).json({
        error: error.message,
      });
    }

    return res.status(201).json({
      expense: data,
    });
  } catch (error) {
    console.error('Add expense error:', error);
    return res.status(500).json({
      error: 'Internal server error',
    });
  }
};

/**
 * GET /api/trips/:id/expenses - 获取支出列表
 */
export const getExpenses = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { id: tripId } = req.params;

    // 使用用户的 token 创建 Supabase 客户端
    const authHeader = req.headers.authorization;
    const userSupabase = getSupabaseClient(authHeader);

    // 先检查旅行是否存在且属于当前用户
    const { data: trip, error: tripError } = await userSupabase
      .from('trips')
      .select('id, user_id')
      .eq('id', tripId)
      .single();

    if (tripError || !trip) {
      return res.status(404).json({
        error: 'Trip not found',
      });
    }

    if (trip.user_id !== user.id) {
      return res.status(403).json({
        error: 'Access denied',
      });
    }

    // 获取支出列表
    const { data, error } = await userSupabase
      .from('expenses')
      .select('*')
      .eq('trip_id', tripId)
      .order('expense_date', { ascending: false });

    if (error) {
      console.error('Get expenses error:', error);
      return res.status(400).json({
        error: error.message,
      });
    }

    return res.status(200).json({
      expenses: data || [],
    });
  } catch (error) {
    console.error('Get expenses error:', error);
    return res.status(500).json({
      error: 'Internal server error',
    });
  }
};

/**
 * PUT /api/trips/:id/expenses/:expenseId - 更新支出
 */
export const updateExpense = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { id: tripId, expenseId } = req.params;
    const updateData = req.body;

    // 使用用户的 token 创建 Supabase 客户端
    const authHeader = req.headers.authorization;
    const userSupabase = getSupabaseClient(authHeader);

    // 先检查旅行是否存在且属于当前用户
    const { data: trip, error: tripError } = await userSupabase
      .from('trips')
      .select('id, user_id')
      .eq('id', tripId)
      .single();

    if (tripError || !trip) {
      return res.status(404).json({
        error: 'Trip not found',
      });
    }

    if (trip.user_id !== user.id) {
      return res.status(403).json({
        error: 'Access denied',
      });
    }

    // 检查支出是否存在
    const { data: existingExpense, error: expenseError } = await userSupabase
      .from('expenses')
      .select('*')
      .eq('id', expenseId)
      .eq('trip_id', tripId)
      .single();

    if (expenseError || !existingExpense) {
      return res.status(404).json({
        error: 'Expense not found',
      });
    }

    // 构建更新对象（转换字段名）
    const updateFields: any = {};
    if (updateData.category !== undefined) updateFields.category = updateData.category;
    if (updateData.amount !== undefined) updateFields.amount = updateData.amount;
    if (updateData.currency !== undefined) updateFields.currency = updateData.currency;
    if (updateData.description !== undefined) updateFields.description = updateData.description;
    if (updateData.expenseDate !== undefined) updateFields.expense_date = updateData.expenseDate;

    // 更新支出
    const { data, error } = await userSupabase
      .from('expenses')
      .update(updateFields)
      .eq('id', expenseId)
      .select()
      .single();

    if (error) {
      console.error('Update expense error:', error);
      return res.status(400).json({
        error: error.message,
      });
    }

    return res.status(200).json({
      expense: data,
    });
  } catch (error) {
    console.error('Update expense error:', error);
    return res.status(500).json({
      error: 'Internal server error',
    });
  }
};

/**
 * DELETE /api/trips/:id/expenses/:expenseId - 删除支出
 */
export const deleteExpense = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { id: tripId, expenseId } = req.params;

    // 使用用户的 token 创建 Supabase 客户端
    const authHeader = req.headers.authorization;
    const userSupabase = getSupabaseClient(authHeader);

    // 先检查旅行是否存在且属于当前用户
    const { data: trip, error: tripError } = await userSupabase
      .from('trips')
      .select('id, user_id')
      .eq('id', tripId)
      .single();

    if (tripError || !trip) {
      return res.status(404).json({
        error: 'Trip not found',
      });
    }

    if (trip.user_id !== user.id) {
      return res.status(403).json({
        error: 'Access denied',
      });
    }

    // 检查支出是否存在
    const { data: existingExpense, error: expenseError } = await userSupabase
      .from('expenses')
      .select('*')
      .eq('id', expenseId)
      .eq('trip_id', tripId)
      .single();

    if (expenseError || !existingExpense) {
      return res.status(404).json({
        error: 'Expense not found',
      });
    }

    // 删除支出
    const { error } = await userSupabase
      .from('expenses')
      .delete()
      .eq('id', expenseId);

    if (error) {
      console.error('Delete expense error:', error);
      return res.status(400).json({
        error: error.message,
      });
    }

    return res.status(200).json({
      message: 'Expense deleted successfully',
    });
  } catch (error) {
    console.error('Delete expense error:', error);
    return res.status(500).json({
      error: 'Internal server error',
    });
  }
};

/**
 * GET /api/trips/:id/budget - 获取预算摘要
 */
export const getBudgetSummary = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { id: tripId } = req.params;

    // 使用用户的 token 创建 Supabase 客户端
    const authHeader = req.headers.authorization;
    const userSupabase = getSupabaseClient(authHeader);

    // 先检查旅行是否存在且属于当前用户
    const { data: trip, error: tripError } = await userSupabase
      .from('trips')
      .select('id, user_id, budget_total, currency')
      .eq('id', tripId)
      .single();

    if (tripError || !trip) {
      return res.status(404).json({
        error: 'Trip not found',
      });
    }

    if (trip.user_id !== user.id) {
      return res.status(403).json({
        error: 'Access denied',
      });
    }

    // 获取总支出
    const { data: totalResult, error: totalError } = await userSupabase
      .rpc('get_trip_total_expenses', { trip_uuid: tripId });

    if (totalError) {
      console.error('Get total expenses error:', totalError);
      return res.status(400).json({
        error: totalError.message,
      });
    }

    // 获取按类别的支出
    const { data: byCategoryResult, error: categoryError } = await userSupabase
      .rpc('get_trip_expenses_by_category', { trip_uuid: tripId });

    if (categoryError) {
      console.error('Get expenses by category error:', categoryError);
      return res.status(400).json({
        error: categoryError.message,
      });
    }

    const budgetTotal = parseFloat(trip.budget_total || '0');
    const spent = totalResult || 0;
    const remaining = budgetTotal - spent;

    return res.status(200).json({
      budget: {
        total: budgetTotal,
        spent: spent,
        remaining: remaining,
        currency: trip.currency || 'CNY',
        byCategory: byCategoryResult || [],
      },
    });
  } catch (error) {
    console.error('Get budget summary error:', error);
    return res.status(500).json({
      error: 'Internal server error',
    });
  }
};

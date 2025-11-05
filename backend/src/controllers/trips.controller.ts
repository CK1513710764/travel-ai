import { Request, Response } from 'express';
import { supabase } from '../config/supabase';
import { getSupabaseClient } from '../config/supabase';

/**
 * 旅行计划控制器
 * 处理旅行计划的 CRUD 操作
 */

/**
 * POST /api/trips - 创建旅行计划
 */
export const createTrip = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const {
      title,
      destination,
      startDate,
      endDate,
      travelerCount,
      budgetTotal,
      currency,
    } = req.body;

    // 使用用户的 token 创建 Supabase 客户端
    const authHeader = req.headers.authorization;
    const userSupabase = getSupabaseClient(authHeader);

    // 插入旅行计划
    const { data, error } = await userSupabase
      .from('trips')
      .insert({
        user_id: user.id,
        title,
        destination,
        start_date: startDate,
        end_date: endDate,
        traveler_count: travelerCount,
        budget_total: budgetTotal,
        currency: currency || 'CNY',
        status: 'planning',
      })
      .select()
      .single();

    if (error) {
      console.error('Create trip error:', error);
      return res.status(400).json({
        error: error.message,
      });
    }

    return res.status(201).json({
      trip: data,
    });
  } catch (error) {
    console.error('Create trip error:', error);
    return res.status(500).json({
      error: 'Internal server error',
    });
  }
};

/**
 * GET /api/trips - 获取用户的旅行列表
 */
export const getTrips = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;

    // 使用用户的 token 创建 Supabase 客户端
    const authHeader = req.headers.authorization;
    const userSupabase = getSupabaseClient(authHeader);

    // 获取当前用户的旅行列表（RLS 会自动过滤）
    const { data, error } = await userSupabase
      .from('trips')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Get trips error:', error);
      return res.status(400).json({
        error: error.message,
      });
    }

    return res.status(200).json({
      trips: data || [],
    });
  } catch (error) {
    console.error('Get trips error:', error);
    return res.status(500).json({
      error: 'Internal server error',
    });
  }
};

/**
 * GET /api/trips/:id - 获取旅行详情
 */
export const getTripById = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { id } = req.params;

    // 使用用户的 token 创建 Supabase 客户端
    const authHeader = req.headers.authorization;
    const userSupabase = getSupabaseClient(authHeader);

    // 获取旅行详情
    const { data, error } = await userSupabase
      .from('trips')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // 没有找到记录
        return res.status(404).json({
          error: 'Trip not found',
        });
      }
      console.error('Get trip error:', error);
      return res.status(400).json({
        error: error.message,
      });
    }

    // 检查用户权限
    if (data.user_id !== user.id) {
      return res.status(403).json({
        error: 'Access denied',
      });
    }

    return res.status(200).json({
      trip: data,
    });
  } catch (error) {
    console.error('Get trip error:', error);
    return res.status(500).json({
      error: 'Internal server error',
    });
  }
};

/**
 * PUT /api/trips/:id - 更新旅行计划
 */
export const updateTrip = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { id } = req.params;
    const updateData = req.body;

    // 使用用户的 token 创建 Supabase 客户端
    const authHeader = req.headers.authorization;
    const userSupabase = getSupabaseClient(authHeader);

    // 先检查旅行是否存在
    const { data: existingTrip, error: fetchError } = await userSupabase
      .from('trips')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !existingTrip) {
      return res.status(404).json({
        error: 'Trip not found',
      });
    }

    // 检查用户权限
    if (existingTrip.user_id !== user.id) {
      return res.status(403).json({
        error: 'Access denied',
      });
    }

    // 构建更新对象（转换字段名）
    const updateFields: any = {};
    if (updateData.title !== undefined) updateFields.title = updateData.title;
    if (updateData.destination !== undefined) updateFields.destination = updateData.destination;
    if (updateData.startDate !== undefined) updateFields.start_date = updateData.startDate;
    if (updateData.endDate !== undefined) updateFields.end_date = updateData.endDate;
    if (updateData.travelerCount !== undefined) updateFields.traveler_count = updateData.travelerCount;
    if (updateData.budgetTotal !== undefined) updateFields.budget_total = updateData.budgetTotal;
    if (updateData.currency !== undefined) updateFields.currency = updateData.currency;
    if (updateData.status !== undefined) updateFields.status = updateData.status;
    if (updateData.itinerary !== undefined) updateFields.itinerary = updateData.itinerary;

    // 更新旅行计划
    const { data, error } = await userSupabase
      .from('trips')
      .update(updateFields)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Update trip error:', error);
      return res.status(400).json({
        error: error.message,
      });
    }

    return res.status(200).json({
      trip: data,
    });
  } catch (error) {
    console.error('Update trip error:', error);
    return res.status(500).json({
      error: 'Internal server error',
    });
  }
};

/**
 * DELETE /api/trips/:id - 删除旅行计划
 */
export const deleteTrip = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { id } = req.params;

    // 使用用户的 token 创建 Supabase 客户端
    const authHeader = req.headers.authorization;
    const userSupabase = getSupabaseClient(authHeader);

    // 先检查旅行是否存在
    const { data: existingTrip, error: fetchError } = await userSupabase
      .from('trips')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !existingTrip) {
      return res.status(404).json({
        error: 'Trip not found',
      });
    }

    // 检查用户权限
    if (existingTrip.user_id !== user.id) {
      return res.status(403).json({
        error: 'Access denied',
      });
    }

    // 删除旅行计划
    const { error } = await userSupabase
      .from('trips')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Delete trip error:', error);
      return res.status(400).json({
        error: error.message,
      });
    }

    return res.status(200).json({
      message: 'Trip deleted successfully',
    });
  } catch (error) {
    console.error('Delete trip error:', error);
    return res.status(500).json({
      error: 'Internal server error',
    });
  }
};

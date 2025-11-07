import { Request, Response } from 'express';
import { supabase } from '../config/supabase';
import { getSupabaseClient } from '../config/supabase';
import { generateItinerary, parseVoiceInput } from '../services/ai.service';

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

/**
 * POST /api/trips/:id/generate - 生成 AI 行程
 */
export const generateTripItinerary = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { id: tripId } = req.params;

    // 使用用户的 token 创建 Supabase 客户端
    const authHeader = req.headers.authorization;
    const userSupabase = getSupabaseClient(authHeader);

    // 获取旅行信息
    const { data: trip, error: fetchError } = await userSupabase
      .from('trips')
      .select('*')
      .eq('id', tripId)
      .single();

    if (fetchError || !trip) {
      return res.status(404).json({
        error: 'Trip not found',
      });
    }

    // 检查用户权限
    if (trip.user_id !== user.id) {
      return res.status(403).json({
        error: 'Access denied',
      });
    }

    // 调用 AI 服务生成行程
    const itinerary = await generateItinerary({
      title: trip.title,
      destination: trip.destination,
      startDate: trip.start_date,
      endDate: trip.end_date,
      travelerCount: trip.traveler_count,
      budgetTotal: trip.budget_total,
      currency: trip.currency,
    });

    // 为行程中的地点添加地理坐标
    const { batchGeocode } = await import('../services/geocoding.service');

    // 收集所有地点地址
    const addresses: string[] = [];
    itinerary.days?.forEach((day) => {
      day.activities?.forEach((activity) => {
        if (activity.location) {
          addresses.push(activity.location);
        }
      });
    });

    console.log(`开始地理编码 ${addresses.length} 个地点...`);

    // 批量获取坐标
    const geocodeResults = await batchGeocode(trip.destination, addresses);

    console.log(`地理编码完成，成功获取 ${geocodeResults.size} 个坐标`);

    // 将坐标添加到行程中
    itinerary.days?.forEach((day) => {
      day.activities?.forEach((activity) => {
        if (activity.location) {
          const result = geocodeResults.get(activity.location);
          if (result) {
            (activity as any).coordinates = result.location;
          }
        }
      });
    });

    // 更新旅行计划的 itinerary 字段
    const { data: updatedTrip, error: updateError } = await userSupabase
      .from('trips')
      .update({ itinerary })
      .eq('id', tripId)
      .select()
      .single();

    if (updateError) {
      console.error('Update trip itinerary error:', updateError);
      return res.status(400).json({
        error: updateError.message,
      });
    }

    return res.status(200).json({
      trip: updatedTrip,
    });
  } catch (error: any) {
    console.error('Generate itinerary error:', error);
    return res.status(500).json({
      error: error.message || 'Internal server error',
    });
  }
};


/**
 * POST /api/parse-voice - 使用 AI 解析语音文本
 */
export const parseVoiceText = async (req: Request, res: Response) => {
  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({
        error: '缺少语音文本',
      });
    }

    // 调用 AI 服务解析语音文本
    const parsedInfo = await parseVoiceInput(text);

    return res.status(200).json({
      data: parsedInfo,
    });
  } catch (error: any) {
    console.error('Parse voice text error:', error);
    return res.status(500).json({
      error: error.message || 'Internal server error',
    });
  }
};

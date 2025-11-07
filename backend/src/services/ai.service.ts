import OpenAI from 'openai';

/**
 * 阿里云百炼 AI 服务
 * 使用 OpenAI 兼容模式调用通义千问模型
 */

// 初始化 OpenAI 客户端（连接到阿里云百炼）
const getAIClient = () => {
  const apiKey = process.env.DASHSCOPE_API_KEY || process.env.ALIYUN_API_KEY;

  if (!apiKey) {
    console.warn('AI API key not configured. AI features will be disabled.');
    return null;
  }

  return new OpenAI({
    apiKey,
    baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
  });
};

/**
 * 旅行数据接口
 */
interface TripData {
  title: string;
  destination: string;
  startDate: string;
  endDate: string;
  travelerCount: number;
  budgetTotal?: number;
  currency?: string;
}

/**
 * 行程数据结构
 */
export interface ItineraryDay {
  day: number;
  date: string;
  title: string;
  activities: Array<{
    time: string;
    activity: string;
    location: string;
    description?: string;
    estimatedCost?: number;
    coordinates?: {
      lng: number;
      lat: number;
    };
  }>;
  meals: {
    breakfast?: string;
    lunch?: string;
    dinner?: string;
  };
  accommodation?: string;
  notes?: string;
}

export interface Itinerary {
  summary: string;
  days: ItineraryDay[];
  tips: string[];
  estimatedTotalCost?: number;
}

/**
 * 生成旅行行程
 */
export const generateItinerary = async (tripData: TripData): Promise<Itinerary> => {
  const client = getAIClient();

  if (!client) {
    throw new Error('AI service not configured. Please set DASHSCOPE_API_KEY or ALIYUN_API_KEY environment variable.');
  }

  const { title, destination, startDate, endDate, travelerCount, budgetTotal, currency = 'CNY' } = tripData;

  // 计算旅行天数
  const start = new Date(startDate);
  const end = new Date(endDate);
  const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

  // 构建提示词
  const prompt = `你是一位专业的旅行规划师。请为以下旅行生成详细的行程计划：

旅行信息：
- 目的地：${destination}
- 出发日期：${startDate}
- 返回日期：${endDate}
- 旅行天数：${days} 天
- 旅行人数：${travelerCount} 人
${budgetTotal ? `- 预算：${budgetTotal} ${currency}` : ''}

请生成一个详细的行程计划，包括：
1. 每天的活动安排（景点、体验、交通）
2. 餐饮推荐（早中晚餐）
3. 住宿建议
4. 预估费用
5. 旅行小贴士
6. **重要**：每个活动必须包含准确的 GPS 坐标（经度 longitude 和纬度 latitude）

请以 JSON 格式返回，格式如下：
{
  "summary": "行程概述",
  "days": [
    {
      "day": 1,
      "date": "2025-06-01",
      "title": "第一天标题",
      "activities": [
        {
          "time": "09:00",
          "activity": "活动名称",
          "location": "具体地点",
          "description": "活动描述",
          "estimatedCost": 100,
          "coordinates": {
            "lng": 135.5,
            "lat": 34.6
          }
        }
      ],
      "meals": {
        "breakfast": "早餐推荐",
        "lunch": "午餐推荐",
        "dinner": "晚餐推荐"
      },
      "accommodation": "住宿推荐",
      "notes": "当天注意事项"
    }
  ],
  "tips": ["旅行小贴士1", "旅行小贴士2"],
  "estimatedTotalCost": 5000
}

**重要提醒**：
- 每个活动的 coordinates 字段必须包含该地点的真实 GPS 坐标
- 经度（lng）范围：-180 到 180
- 纬度（lat）范围：-90 到 90
- 请使用该地点的实际坐标，例如东京塔的坐标是 {"lng": 139.7454, "lat": 35.6586}
- 如果活动是交通（如"乘坐地铁"），可以使用起点或终点的坐标

请确保返回的是有效的 JSON 格式，不要包含任何额外的文本说明。`;

  try {
    const completion = await client.chat.completions.create({
      model: 'qwen-plus', // 使用通义千问 Plus 模型
      messages: [
        {
          role: 'system',
          content: '你是一位专业的旅行规划师，擅长为用户制定详细的旅行行程。你的回复必须是有效的 JSON 格式。',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 4000,
    });

    const responseText = completion.choices[0]?.message?.content;

    if (!responseText) {
      throw new Error('AI 服务未返回内容');
    }

    // 尝试提取 JSON（可能包含在 markdown 代码块中）
    let jsonText = responseText.trim();

    // 移除可能的 markdown 代码块标记
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?$/g, '');
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/```\n?/g, '').replace(/```\n?$/g, '');
    }

    // 解析 JSON
    const itinerary = JSON.parse(jsonText);

    // 验证返回的数据结构
    if (!itinerary.days || !Array.isArray(itinerary.days)) {
      throw new Error('AI 返回的行程格式无效：缺少 days 数组');
    }

    return itinerary;
  } catch (error: any) {
    console.error('AI 行程生成错误:', error);

    if (error instanceof SyntaxError) {
      throw new Error('AI 返回的数据格式无效，请重试');
    }

    throw new Error(`AI 服务调用失败: ${error.message}`);
  }
};

/**
 * 解析语音文本，提取旅行信息
 */
export interface ParsedTripInfo {
  title?: string;
  destination?: string;
  startDate?: string;
  endDate?: string;
  travelerCount?: number;
  budgetTotal?: number;
  preferences?: string;
}

export const parseVoiceInput = async (voiceText: string): Promise<ParsedTripInfo> => {
  const client = getAIClient();

  if (!client) {
    throw new Error('AI service not configured. Please set DASHSCOPE_API_KEY or ALIYUN_API_KEY environment variable.');
  }

  const prompt = `你是一个旅行规划助手。请从用户的语音描述中提取旅行信息。

用户描述：${voiceText}

请提取以下信息（如果用户没有提到某项，该字段留空）：
1. destination（目的地）- 城市或地区名称
2. days（天数）- 旅行持续天数
3. travelerCount（人数）- 旅行人数
4. budgetTotal（预算）- 总预算金额（转换为数字，单位：元）
5. preferences（偏好）- 用户提到的旅行偏好、兴趣等

请以 JSON 格式返回，格式如下：
{
  "destination": "城市名",
  "days": 5,
  "travelerCount": 2,
  "budgetTotal": 10000,
  "preferences": "美食、文化"
}

注意：
- 如果提到"万"，转换为对应的数字（如 1万 = 10000）
- 如果提到"千"，转换为对应的数字（如 5千 = 5000）
- 中文数字要转换为阿拉伯数字（如"五天" = 5，"两个人" = 2）
- 只返回 JSON，不要有其他文字说明`;

  try {
    const completion = await client.chat.completions.create({
      model: 'qwen-plus',
      messages: [
        {
          role: 'system',
          content: '你是一个专业的旅行信息提取助手。你的任务是从用户的自然语言描述中准确提取旅行相关信息，并以 JSON 格式返回。',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.3, // 降低温度以提高准确性
      max_tokens: 500,
    });

    const responseText = completion.choices[0]?.message?.content;

    if (!responseText) {
      throw new Error('AI 服务未返回内容');
    }

    // 提取 JSON
    let jsonText = responseText.trim();
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?$/g, '');
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/```\n?/g, '').replace(/```\n?$/g, '');
    }

    const parsed = JSON.parse(jsonText);

    // 构建返回结果
    const result: ParsedTripInfo = {};

    if (parsed.destination) {
      result.destination = parsed.destination;
      // 生成标题
      const days = parsed.days ? `${parsed.days}天` : '';
      result.title = `${parsed.destination}${days}之旅`;
    }

    if (parsed.days) {
      // 计算日期
      const today = new Date();
      result.startDate = today.toISOString().split('T')[0];
      const endDate = new Date(today);
      endDate.setDate(endDate.getDate() + parseInt(parsed.days) - 1);
      result.endDate = endDate.toISOString().split('T')[0];
    }

    if (parsed.travelerCount) {
      result.travelerCount = parseInt(parsed.travelerCount);
    }

    if (parsed.budgetTotal) {
      result.budgetTotal = parseFloat(parsed.budgetTotal);
    }

    if (parsed.preferences) {
      result.preferences = parsed.preferences;
    }

    return result;
  } catch (error: any) {
    console.error('AI 语音解析错误:', error);

    if (error instanceof SyntaxError) {
      throw new Error('AI 返回的数据格式无效');
    }

    throw new Error(`AI 解析失败: ${error.message}`);
  }
};

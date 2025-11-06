/**
 * AI 服务 Mock
 * 用于测试，模拟 AI 行程生成
 */

import { Itinerary } from '../ai.service';

export const generateItinerary = jest.fn().mockImplementation(async (tripData: any): Promise<Itinerary> => {
  // 模拟 AI 生成的行程数据
  const { startDate, endDate } = tripData;
  const start = new Date(startDate);
  const end = new Date(endDate);
  const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

  const itinerary: Itinerary = {
    summary: `这是一个精彩的${days}天${tripData.destination}之旅，包含了当地最具特色的景点和体验。`,
    days: [],
    tips: [
      '提前预订热门景点门票可以节省排队时间',
      '建议购买当地交通卡，方便出行',
      '注意防晒和补水，随身携带雨具',
    ],
    estimatedTotalCost: tripData.budgetTotal || 5000,
  };

  // 生成每天的行程
  for (let i = 0; i < days; i++) {
    const currentDate = new Date(start);
    currentDate.setDate(start.getDate() + i);
    const dateStr = currentDate.toISOString().split('T')[0];

    itinerary.days.push({
      day: i + 1,
      date: dateStr,
      title: `第${i + 1}天：探索${tripData.destination}`,
      activities: [
        {
          time: '09:00',
          activity: '参观著名景点',
          location: `${tripData.destination}市中心`,
          description: '游览当地最具代表性的景点',
          estimatedCost: 200,
        },
        {
          time: '14:00',
          activity: '体验当地文化',
          location: `${tripData.destination}文化区`,
          description: '深入了解当地文化和历史',
          estimatedCost: 150,
        },
      ],
      meals: {
        breakfast: '酒店自助早餐',
        lunch: '当地特色餐厅',
        dinner: '网红美食街',
      },
      accommodation: i < days - 1 ? '四星级酒店' : undefined,
      notes: '建议提前预约热门景点',
    });
  }

  return itinerary;
});

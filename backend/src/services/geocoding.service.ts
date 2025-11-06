import axios from 'axios';

interface GeocodeResult {
  location: {
    lng: number;
    lat: number;
  };
  formatted_address: string;
}

/**
 * 使用高德地图 Web 服务 API 进行地理编码
 */
export const geocodeAddress = async (
  city: string,
  address: string
): Promise<GeocodeResult | null> => {
  const apiKey = process.env.AMAP_WEB_KEY;

  if (!apiKey) {
    console.error('高德地图 Web 服务 API Key 未配置');
    return null;
  }

  try {
    const query = `${city} ${address}`;
    const url = 'https://restapi.amap.com/v3/geocode/geo';

    const response = await axios.get(url, {
      params: {
        key: apiKey,
        address: query,
        city: city,
      },
    });

    console.log(`地理编码查询: "${query}"`, {
      status: response.data.status,
      count: response.data.count,
    });

    if (
      response.data.status === '1' &&
      response.data.geocodes &&
      response.data.geocodes.length > 0
    ) {
      const geocode = response.data.geocodes[0];
      const [lng, lat] = geocode.location.split(',').map(Number);

      return {
        location: { lng, lat },
        formatted_address: geocode.formatted_address || address,
      };
    }

    console.warn(`地理编码失败: "${query}"`, response.data);
    return null;
  } catch (error: any) {
    console.error(`地理编码错误: "${address}"`, error.message);
    return null;
  }
};

/**
 * 批量地理编码
 */
export const batchGeocode = async (
  city: string,
  addresses: string[]
): Promise<Map<string, GeocodeResult>> => {
  const results = new Map<string, GeocodeResult>();

  // 串行请求，避免并发限制
  for (const address of addresses) {
    const result = await geocodeAddress(city, address);
    if (result) {
      results.set(address, result);
    }
    // 添加延迟避免 API 限流
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  return results;
};

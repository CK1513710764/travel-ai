import { useEffect, useRef, useState } from 'react';
import AMapLoader from '@amap/amap-jsapi-loader';
import type { Itinerary } from '../types';

interface MapViewProps {
  itinerary: Itinerary | null;
  destination: string;
}

interface LocationPoint {
  name: string;
  address: string;
  day: number;
  time: string;
}

const MapView: React.FC<MapViewProps> = ({ itinerary, destination }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<any>(null);
  const [AMap, setAMap] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // 初始化地图
  useEffect(() => {
    if (!mapRef.current) {
      return;
    }

    let isMounted = true;

    const initMap = async () => {
      const apiKey = import.meta.env.VITE_AMAP_API_KEY;

      if (!apiKey) {
        console.error('高德地图 API Key 未配置');
        setError('地图 API Key 未配置，请检查环境变量');
        setLoading(false);
        return;
      }

      console.log('开始加载高德地图...', { apiKey: apiKey.substring(0, 8) + '...' });

      try {
        const AMapInstance = await AMapLoader.load({
          key: apiKey,
          version: '2.0',
          plugins: ['AMap.Geocoder', 'AMap.Marker', 'AMap.InfoWindow'],
        });

        if (!isMounted) return;

        console.log('高德地图 SDK 加载成功');

        if (!mapRef.current) {
          console.error('地图容器在加载后消失了');
          setError('地图容器错误');
          setLoading(false);
          return;
        }

        const mapInstance = new AMapInstance.Map(mapRef.current, {
          zoom: 12,
          center: [116.397428, 39.90923], // 默认北京
          viewMode: '2D',
        });

        console.log('地图实例创建成功');

        if (isMounted) {
          setAMap(AMapInstance);
          setMap(mapInstance);
          setLoading(false);
        }
      } catch (err: any) {
        console.error('地图加载失败:', err);
        const errorMessage = err.message || '未知错误';
        if (isMounted) {
          setError(`地图加载失败: ${errorMessage}`);
          setLoading(false);
        }
      }
    };

    initMap();

    return () => {
      isMounted = false;
      if (map) {
        console.log('销毁地图实例');
        map.destroy();
      }
    };
  }, []);

  // 提取行程中的地点信息
  const extractLocations = (): LocationPoint[] => {
    if (!itinerary?.days) return [];

    const locations: LocationPoint[] = [];
    itinerary.days.forEach((day) => {
      day.activities.forEach((activity) => {
        locations.push({
          name: activity.activity,
          address: activity.location,
          day: day.day,
          time: activity.time,
        });
      });
    });
    return locations;
  };

  // 直接使用后端返回的坐标添加标记
  useEffect(() => {
    if (!map || !AMap || !itinerary) {
      console.log('地图或数据未就绪:', { map: !!map, AMap: !!AMap, itinerary: !!itinerary });
      return;
    }

    const markers: any[] = [];
    const bounds: any[] = [];

    console.log('开始添加地点标记...');

    // 遍历所有天的活动
    itinerary.days?.forEach((day) => {
      day.activities?.forEach((activity) => {
        // 检查活动是否有坐标信息
        if (activity.coordinates) {
          const { lng, lat } = activity.coordinates;
          const position = [lng, lat];

          console.log(`添加标记: ${activity.activity} at [${lng}, ${lat}]`);

          // 创建标记
          const marker = new AMap.Marker({
            position: position,
            title: activity.activity,
            label: {
              content: `Day ${day.day}`,
              direction: 'top',
            },
          });

          // 添加信息窗口
          const infoWindow = new AMap.InfoWindow({
            content: `
              <div style="padding: 10px; min-width: 200px;">
                <h4 style="margin: 0 0 8px 0; color: #1f2937;">${activity.activity}</h4>
                <p style="margin: 4px 0; color: #6b7280;">📍 ${activity.location}</p>
                <p style="margin: 4px 0; color: #667eea;">🕐 Day ${day.day} - ${activity.time}</p>
                ${activity.description ? `<p style="margin: 8px 0 0 0; color: #4b5563; font-size: 13px;">${activity.description}</p>` : ''}
                ${activity.estimatedCost ? `<p style="margin: 4px 0 0 0; color: #10b981;">💰 约 ¥${activity.estimatedCost}</p>` : ''}
              </div>
            `,
          });

          marker.on('click', () => {
            infoWindow.open(map, position);
          });

          map.add(marker);
          markers.push(marker);
          bounds.push(position);
        } else {
          console.warn(`活动 "${activity.activity}" 没有坐标信息`);
        }
      });
    });

    console.log(`已添加 ${markers.length} 个标记`);

    // 调整地图视野以显示所有标记
    if (markers.length > 0) {
      if (markers.length === 1) {
        map.setCenter(bounds[0]);
        map.setZoom(15);
      } else {
        map.setFitView(markers);
      }
      console.log('地图视野已调整');
    } else {
      console.warn('没有可显示的标记（所有活动都缺少坐标）');
    }

    // 清理函数
    return () => {
      console.log('清理标记:', markers.length);
      markers.forEach((marker) => marker.remove());
    };
  }, [map, AMap, itinerary]);

  if (error) {
    return (
      <div className="map-error">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="map-container">
      {loading && (
        <div className="map-loading-overlay">
          <div className="spinner"></div>
          <p>加载地图中...</p>
        </div>
      )}
      <div ref={mapRef} className="map-view" style={{ opacity: loading ? 0 : 1 }}></div>
    </div>
  );
};

export default MapView;

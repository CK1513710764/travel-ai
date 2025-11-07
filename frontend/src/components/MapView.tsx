import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-polylinedecorator';
import type { Itinerary } from '../types';

interface MapViewProps {
  itinerary: Itinerary | null;
  destination?: string;
}

// 修复 Leaflet 默认图标路径问题
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const MapView: React.FC<MapViewProps> = ({ itinerary }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const polylinesRef = useRef<L.Polyline[]>([]);
  const decoratorsRef = useRef<any[]>([]);

  // 初始化地图
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) {
      return;
    }

    console.log('初始化 Leaflet 地图...');

    // 创建地图实例
    const map = L.map(mapRef.current).setView([39.9042, 116.4074], 12); // 默认北京

    // 添加 OpenStreetMap 瓦片层
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    mapInstanceRef.current = map;

    console.log('Leaflet 地图初始化成功');

    // 清理函数
    return () => {
      if (mapInstanceRef.current) {
        console.log('销毁地图实例');
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // 添加标记
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !itinerary) {
      console.log('地图或数据未就绪');
      return;
    }

    // 清除旧标记、路线和装饰器
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];
    polylinesRef.current.forEach((polyline) => polyline.remove());
    polylinesRef.current = [];
    decoratorsRef.current.forEach((decorator) => decorator.remove());
    decoratorsRef.current = [];

    const bounds: L.LatLngTuple[] = [];

    console.log('开始添加地点标记和路线...');

    // 定义每天的颜色
    const dayColors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

    // 遍历所有天的活动
    itinerary.days?.forEach((day) => {
      const color = dayColors[(day.day - 1) % dayColors.length];
      const dayRoute: L.LatLngTuple[] = []; // 当天的路线坐标

      day.activities?.forEach((activity) => {
        // 检查活动是否有坐标信息
        if (activity.coordinates) {
          const { lng, lat } = activity.coordinates;
          const position: L.LatLngTuple = [lat, lng]; // Leaflet 使用 [lat, lng] 顺序

          console.log(`添加标记: ${activity.activity} at [${lat}, ${lng}]`);

          // 创建自定义图标
          const customIcon = L.divIcon({
            className: 'custom-marker',
            html: `
              <div style="
                background-color: ${color};
                width: 30px;
                height: 30px;
                border-radius: 50% 50% 50% 0;
                transform: rotate(-45deg);
                border: 2px solid white;
                box-shadow: 0 2px 4px rgba(0,0,0,0.3);
                display: flex;
                align-items: center;
                justify-content: center;
              ">
                <span style="
                  color: white;
                  font-weight: bold;
                  font-size: 12px;
                  transform: rotate(45deg);
                ">${day.day}</span>
              </div>
            `,
            iconSize: [30, 30],
            iconAnchor: [15, 30],
            popupAnchor: [0, -30],
          });

          // 创建标记
          const marker = L.marker(position, { icon: customIcon });

          // 创建弹窗内容
          const popupContent = `
            <div style="padding: 4px; min-width: 200px;">
              <h4 style="margin: 0 0 8px 0; color: #1f2937; font-size: 14px;">${activity.activity}</h4>
              <p style="margin: 4px 0; color: #6b7280; font-size: 13px;">📍 ${activity.location}</p>
              <p style="margin: 4px 0; color: #667eea; font-size: 13px;">🕐 Day ${day.day} - ${activity.time}</p>
              ${activity.description ? `<p style="margin: 8px 0 0 0; color: #4b5563; font-size: 12px;">${activity.description}</p>` : ''}
              ${activity.estimatedCost ? `<p style="margin: 4px 0 0 0; color: #10b981; font-size: 13px;">💰 约 ¥${activity.estimatedCost}</p>` : ''}
            </div>
          `;

          marker.bindPopup(popupContent);
          marker.addTo(map);

          markersRef.current.push(marker);
          bounds.push(position);

          // 添加到当天路线
          dayRoute.push(position);
        } else {
          console.warn(`活动 "${activity.activity}" 没有坐标信息`);
        }
      });

      // 绘制当天的路线（如果有至少2个地点）
      if (dayRoute.length >= 2) {
        const polyline = L.polyline(dayRoute, {
          color: color,
          weight: 3,
          opacity: 0.7,
          smoothFactor: 1,
        }).addTo(map);

        // 添加路线提示
        polyline.bindTooltip(`Day ${day.day} 路线`, {
          permanent: false,
          direction: 'center',
        });

        // 添加方向箭头
        const decorator = (L as any).polylineDecorator(polyline, {
          patterns: [
            {
              offset: '10%',
              repeat: 100,
              symbol: (L as any).Symbol.arrowHead({
                pixelSize: 12,
                polygon: false,
                pathOptions: {
                  stroke: true,
                  color: color,
                  weight: 2,
                  opacity: 0.8,
                },
              }),
            },
          ],
        }).addTo(map);

        polylinesRef.current.push(polyline);
        decoratorsRef.current.push(decorator);
        console.log(`Day ${day.day} 路线已绘制，包含 ${dayRoute.length} 个地点，已添加方向箭头`);
      }
    });

    console.log(`已添加 ${markersRef.current.length} 个标记`);

    // 调整地图视野以显示所有标记
    if (bounds.length > 0) {
      if (bounds.length === 1) {
        map.setView(bounds[0], 15);
      } else {
        map.fitBounds(bounds, { padding: [50, 50] });
      }
      console.log('地图视野已调整');
    } else {
      console.warn('没有可显示的标记（所有活动都缺少坐标）');
    }
  }, [itinerary]);

  return (
    <div className="map-container">
      <div ref={mapRef} className="map-view"></div>
    </div>
  );
};

export default MapView;

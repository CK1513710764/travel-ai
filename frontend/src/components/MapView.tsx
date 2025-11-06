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
    const initMap = async () => {
      try {
        const AMapInstance = await AMapLoader.load({
          key: import.meta.env.VITE_AMAP_API_KEY || '',
          version: '2.0',
          plugins: ['AMap.Geocoder', 'AMap.Marker', 'AMap.Polyline'],
        });

        if (!mapRef.current) return;

        const mapInstance = new AMapInstance.Map(mapRef.current, {
          zoom: 12,
          center: [116.397428, 39.90923], // 默认北京
          viewMode: '3D',
        });

        setAMap(AMapInstance);
        setMap(mapInstance);
        setLoading(false);
      } catch (err) {
        console.error('地图加载失败:', err);
        setError('地图加载失败');
        setLoading(false);
      }
    };

    initMap();

    return () => {
      map?.destroy();
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

  // 地理编码并添加标记
  useEffect(() => {
    if (!map || !AMap || !itinerary) return;

    const locations = extractLocations();
    if (locations.length === 0) return;

    const geocoder = new AMap.Geocoder();
    const markers: any[] = [];
    let bounds: any[] = [];

    // 首先对目的地进行地理编码，作为地图中心
    geocoder.getLocation(destination, (status: string, result: any) => {
      if (status === 'complete' && result.geocodes.length > 0) {
        const centerLocation = result.geocodes[0].location;
        map.setCenter([centerLocation.lng, centerLocation.lat]);
      }
    });

    // 对每个地点进行地理编码
    locations.forEach((location, index) => {
      const searchQuery = `${destination} ${location.address}`;

      geocoder.getLocation(searchQuery, (status: string, result: any) => {
        if (status === 'complete' && result.geocodes.length > 0) {
          const geocode = result.geocodes[0];
          const position = [geocode.location.lng, geocode.location.lat];

          // 创建标记
          const marker = new AMap.Marker({
            position: position,
            title: location.name,
            label: {
              content: `Day ${location.day}`,
              direction: 'top',
            },
          });

          // 添加信息窗口
          const infoWindow = new AMap.InfoWindow({
            content: `
              <div style="padding: 10px;">
                <h4 style="margin: 0 0 8px 0; color: #1f2937;">${location.name}</h4>
                <p style="margin: 4px 0; color: #6b7280;">📍 ${location.address}</p>
                <p style="margin: 4px 0; color: #667eea;">🕐 Day ${location.day} - ${location.time}</p>
              </div>
            `,
          });

          marker.on('click', () => {
            infoWindow.open(map, position);
          });

          map.add(marker);
          markers.push(marker);
          bounds.push(position);

          // 当所有标记都添加完成后，调整地图视野
          if (bounds.length === locations.length) {
            if (bounds.length > 1) {
              map.setFitView(markers);
            }
          }
        }
      });
    });

    // 清理函数
    return () => {
      markers.forEach((marker) => marker.remove());
    };
  }, [map, AMap, itinerary, destination]);

  if (loading) {
    return (
      <div className="map-loading">
        <div className="spinner"></div>
        <p>加载地图中...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="map-error">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="map-container">
      <div ref={mapRef} className="map-view"></div>
    </div>
  );
};

export default MapView;

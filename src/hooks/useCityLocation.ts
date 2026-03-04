import { useState, useEffect } from 'react';

/**
 * 城市定位结果
 */
export interface CityLocationResult {
  city: string;
  province: string;
  district?: string;
  loading: boolean;
  error: string | null;
}

/**
 * 高德地图逆地理编码响应
 */
interface AmapGeocodeResponse {
  status: string;
  regeocode?: {
    addressComponent?: {
      province: string;
      city: string | [];
      district: string;
    };
  };
}

/**
 * 精准城市定位 Hook
 * 使用浏览器 Geolocation API + 高德地图逆地理编码
 */
export const useCityLocation = (autoLocate: boolean = false) => {
  const [result, setResult] = useState<CityLocationResult>({
    city: '上海',
    province: '上海市',
    loading: false,
    error: null,
  });

  const locate = async () => {
    setResult((prev) => ({ ...prev, loading: true, error: null }));

    try {
      // 1. 获取地理位置
      if (!navigator.geolocation) {
        throw new Error('浏览器不支持地理定位');
      }

      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000, // 5 分钟缓存
        });
      });

      const { latitude, longitude } = position.coords;

      // 2. 使用高德地图逆地理编码获取城市信息
      // 注意：生产环境需要申请高德地图 API Key
      const amapKey = import.meta.env.VITE_AMAP_KEY || 'your_amap_key_here';
      const url = `https://restapi.amap.com/v3/geocode/regeo?key=${amapKey}&location=${longitude},${latitude}&extensions=base`;

      const response = await fetch(url);
      const data: AmapGeocodeResponse = await response.json();

      if (data.status === '1' && data.regeocode?.addressComponent) {
        const { province, city, district } = data.regeocode.addressComponent;
        
        // 处理直辖市（city 为空数组）
        const cityName = Array.isArray(city) || !city ? province : city;

        setResult({
          city: cityName,
          province,
          district,
          loading: false,
          error: null,
        });
      } else {
        throw new Error('定位失败，请手动选择城市');
      }
    } catch (error: any) {
      let errorMessage = '定位失败';
      
      if (error.code === 1) {
        errorMessage = '用户拒绝了定位请求';
      } else if (error.code === 2) {
        errorMessage = '位置信息不可用';
      } else if (error.code === 3) {
        errorMessage = '定位超时';
      } else if (error.message) {
        errorMessage = error.message;
      }

      setResult((prev) => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));
    }
  };

  // 自动定位
  useEffect(() => {
    if (autoLocate) {
      locate();
    }
  }, [autoLocate]);

  return {
    ...result,
    locate,
  };
};

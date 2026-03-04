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
 * 如果高德 API 失败，降级使用简单的经纬度判断
 */
export const useCityLocation = (autoLocate: boolean = false) => {
  const [result, setResult] = useState<CityLocationResult>({
    city: '上海',
    province: '上海市',
    loading: false,
    error: null,
  });

  /**
   * 降级方案：基于经纬度简单判断城市
   */
  const getCityByCoordinates = (longitude: number, latitude: number): string => {
    // 基于经度的简单判断
    if (longitude < 104) return '成都';
    if (longitude < 110) return '重庆';
    if (longitude < 114) return '武汉';
    if (longitude < 114.5) return '广州';
    if (longitude < 117) return '深圳';
    if (longitude < 120) return '杭州';
    if (longitude < 122) return '上海';
    if (longitude < 127) return '南京';
    return '北京';
  };

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

      // 2. 尝试使用高德地图逆地理编码获取城市信息
      const amapKey = import.meta.env.VITE_AMAP_KEY || 'your_amap_key_here';
      
      // 如果没有配置 Key 或 Key 无效，直接使用降级方案
      if (!amapKey || amapKey === 'your_amap_key_here') {
        const city = getCityByCoordinates(longitude, latitude);
        setResult({
          city,
          province: city,
          loading: false,
          error: null,
        });
        return;
      }

      try {
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
          // 高德 API 失败，使用降级方案
          const fallbackCity = getCityByCoordinates(longitude, latitude);
          setResult({
            city: fallbackCity,
            province: fallbackCity,
            loading: false,
            error: null,
          });
        }
      } catch (apiError) {
        // 高德 API 调用失败，使用降级方案
        const fallbackCity = getCityByCoordinates(longitude, latitude);
        setResult({
          city: fallbackCity,
          province: fallbackCity,
          loading: false,
          error: null,
        });
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

import { useState, useCallback, useEffect } from 'react';
import { message } from 'antd';
import { useCityLocation } from './useCityLocation';

interface UseCitySelectionOptions {
  initialCity?: string;
  onCityChange?: (city: string) => void;
}

/**
 * 城市选择 Hook
 * 封装城市选择和精准 GPS 定位逻辑
 * 内部使用 useCityLocation 实现精准定位
 */
export const useCitySelection = (options: UseCitySelectionOptions = {}) => {
  const {
    initialCity = '上海',
    onCityChange,
  } = options;

  const [city, setCity] = useState(initialCity);
  
  // 使用精准城市定位 Hook
  const { 
    city: locatedCity, 
    loading: gpsLoading, 
    error: locationError, 
    locate 
  } = useCityLocation();

  // 设置城市
  const handleCityChange = useCallback((newCity: string) => {
    setCity(newCity);
    onCityChange?.(newCity);
  }, [onCityChange]);

  // GPS 定位
  const handleGpsLocation = useCallback(() => {
    if (gpsLoading) return;
    locate();
  }, [gpsLoading, locate]);

  // 监听定位结果
  useEffect(() => {
    if (locatedCity && !gpsLoading && !locationError) {
      handleCityChange(locatedCity);
      message.success(`已定位到: ${locatedCity}`);
    }
  }, [locatedCity, gpsLoading, locationError, handleCityChange]);

  // 监听定位错误
  useEffect(() => {
    if (locationError) {
      message.error(locationError);
    }
  }, [locationError]);

  return {
    city,
    gpsLoading,
    setCity: handleCityChange,
    handleGpsLocation,
  };
};

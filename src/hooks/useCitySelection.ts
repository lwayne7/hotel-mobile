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
  const [hasLocated, setHasLocated] = useState(false); // 标记是否已经定位过
  
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
    setHasLocated(true); // 标记开始定位
    locate();
  }, [gpsLoading, locate]);

  // 监听定位结果（只在用户主动定位时显示提示）
  useEffect(() => {
    if (hasLocated && locatedCity && !gpsLoading && !locationError) {
      handleCityChange(locatedCity);
      message.success(`已定位到: ${locatedCity}`);
      setHasLocated(false); // 重置标记
    }
  }, [locatedCity, gpsLoading, locationError, handleCityChange, hasLocated]);

  // 监听定位错误（只在用户主动定位时显示提示）
  useEffect(() => {
    if (hasLocated && locationError) {
      message.error(locationError);
      setHasLocated(false); // 重置标记
    }
  }, [locationError, hasLocated]);

  return {
    city,
    gpsLoading,
    setCity: handleCityChange,
    handleGpsLocation,
  };
};

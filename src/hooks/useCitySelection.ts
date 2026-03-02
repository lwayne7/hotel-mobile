import { useState, useCallback } from 'react';
import { message } from 'antd';

interface UseCitySelectionOptions {
  initialCity?: string;
  onCityChange?: (city: string) => void;
}

/**
 * 城市选择 Hook
 * 封装城市选择和GPS定位逻辑
 */
export const useCitySelection = (options: UseCitySelectionOptions = {}) => {
  const {
    initialCity = '上海',
    onCityChange,
  } = options;

  const [city, setCity] = useState(initialCity);
  const [gpsLoading, setGpsLoading] = useState(false);

  // 设置城市
  const handleCityChange = useCallback((newCity: string) => {
    setCity(newCity);
    onCityChange?.(newCity);
  }, [onCityChange]);

  // GPS定位
  const handleGpsLocation = useCallback(() => {
    if (!navigator.geolocation) {
      message.error('您的浏览器不支持定位功能');
      return;
    }

    setGpsLoading(true);
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setGpsLoading(false);
        
        // 基于经度简单判断城市（实际应用需要使用地理编码API）
        const { longitude } = position.coords;
        let detectedCity = '上海';
        
        if (longitude < 110) detectedCity = '成都';
        else if (longitude < 114) detectedCity = '广州';
        else if (longitude < 117) detectedCity = '深圳';
        else if (longitude < 120) detectedCity = '杭州';
        else if (longitude < 122) detectedCity = '上海';
        else detectedCity = '北京';
        
        handleCityChange(detectedCity);
        message.success(`已定位到: ${detectedCity}`);
      },
      (error) => {
        setGpsLoading(false);
        
        if (error.code === 1) {
          message.warning('定位权限被拒绝，请在浏览器设置中允许定位');
        } else {
          message.error('定位失败，请手动选择城市');
        }
      },
      { timeout: 5000 }
    );
  }, [handleCityChange]);

  return {
    city,
    gpsLoading,
    setCity: handleCityChange,
    handleGpsLocation,
  };
};

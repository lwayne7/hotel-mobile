import { useCallback } from 'react';
import type { Hotel } from '../services/api';

/**
 * 酒店价格计算 Hook
 * 封装价格相关的计算逻辑
 */
export const useHotelPrice = () => {
  // 获取酒店最低价格
  const getMinPrice = useCallback((hotel: Hotel) => {
    const prices = hotel.roomTypes
      ?.map((r: any) => Number(r?.price))
      .filter((n: number) => !Number.isNaN(n) && n > 0) || [];
    return prices.length ? Math.min(...prices) : 999999;
  }, []);

  // 获取酒店原价
  const getOriginalPrice = useCallback((hotel: Hotel) => {
    const prices = hotel.roomTypes
      ?.map((r: any) => Number(r?.originalPrice))
      .filter((n: number) => !Number.isNaN(n) && n > 0) || [];
    return prices.length ? Math.min(...prices) : 0;
  }, []);

  return {
    getMinPrice,
    getOriginalPrice,
  };
};

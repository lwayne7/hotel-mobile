import { useCallback } from 'react';
import type { Hotel } from '../services/api';

/**
 * 酒店价格计算 Hook
 * 封装价格相关的计算逻辑
 */
export const useHotelPrice = () => {
  // 获取酒店最低价格
  // 后端已经对房型按价格排序，第一个房型就是最低价格
  const getMinPrice = useCallback((hotel: Hotel) => {
    if (!hotel.roomTypes || hotel.roomTypes.length === 0) {
      return 999999;
    }
    
    // 后端已排序，直接取第一个房型的价格
    const firstPrice = Number(hotel.roomTypes[0]?.price);
    if (!Number.isNaN(firstPrice) && firstPrice > 0) {
      return firstPrice;
    }
    
    // 兜底：遍历所有房型找最小值
    const prices = hotel.roomTypes
      .map((r: any) => Number(r?.price))
      .filter((n: number) => !Number.isNaN(n) && n > 0);
    return prices.length ? Math.min(...prices) : 999999;
  }, []);

  // 获取酒店原价
  const getOriginalPrice = useCallback((hotel: Hotel) => {
    if (!hotel.roomTypes || hotel.roomTypes.length === 0) {
      return 0;
    }
    
    // 后端已排序，直接取第一个房型的原价
    const firstOriginalPrice = Number(hotel.roomTypes[0]?.originalPrice);
    if (!Number.isNaN(firstOriginalPrice) && firstOriginalPrice > 0) {
      return firstOriginalPrice;
    }
    
    // 兜底：遍历所有房型找最小值
    const prices = hotel.roomTypes
      .map((r: any) => Number(r?.originalPrice))
      .filter((n: number) => !Number.isNaN(n) && n > 0);
    return prices.length ? Math.min(...prices) : 0;
  }, []);

  return {
    getMinPrice,
    getOriginalPrice,
  };
};

import { useState, useEffect } from 'react';
import { publicHotelApi } from '../services/api';
import type { Hotel } from '../services/api';

/**
 * 酒店详情 Hook
 * 封装酒店详情数据加载逻辑
 */
export const useHotelDetail = (hotelId: string | undefined) => {
  const [hotel, setHotel] = useState<Hotel | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!hotelId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setLoadError(null);

    publicHotelApi
      .getById(parseInt(hotelId, 10))
      .then(setHotel)
      .catch((e) => {
        setHotel(null);
        setLoadError((e as any)?.message || '加载失败，请稍后重试');
      })
      .finally(() => setLoading(false));
  }, [hotelId]);

  // 重新加载
  const reload = () => {
    if (!hotelId) return;
    
    setLoading(true);
    setLoadError(null);

    publicHotelApi
      .getById(parseInt(hotelId, 10))
      .then(setHotel)
      .catch((e) => {
        setHotel(null);
        setLoadError((e as any)?.message || '加载失败，请稍后重试');
      })
      .finally(() => setLoading(false));
  };

  return {
    hotel,
    loading,
    loadError,
    reload,
  };
};

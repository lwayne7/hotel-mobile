import { useEffect, useCallback } from 'react';

/**
 * 价格更新事件类型
 */
export interface PriceUpdateEvent {
  type: 'hotel_price_update';
  timestamp: number;
  hotelId?: number;
  changeKind: 'price_changed' | 'hotel_updated' | 'hotel_online' | 'hotel_offline' | 'hotel_hidden' | 'keepalive';
  version?: number;
}

/**
 * SSE 实时价格更新 Hook
 * 监听后端的价格变化事件，自动更新酒店列表
 */
export const usePriceUpdates = (
  onPriceChange: (event: PriceUpdateEvent) => void,
  enabled: boolean = true
) => {
  const handleMessage = useCallback((event: MessageEvent) => {
    try {
      const data: PriceUpdateEvent = JSON.parse(event.data);
      
      // 忽略心跳事件
      if (data.changeKind === 'keepalive') {
        return;
      }
      
      onPriceChange(data);
    } catch (error) {
      console.error('解析 SSE 消息失败:', error);
    }
  }, [onPriceChange]);

  useEffect(() => {
    if (!enabled) return;

    const API_BASE_URL = import.meta.env.VITE_API_URL || '';
    const baseUrl = API_BASE_URL ? `${API_BASE_URL.replace(/\/$/, '')}/api` : '/api';
    const eventSource = new EventSource(`${baseUrl}/public/hotels/price-updates`);

    eventSource.onmessage = handleMessage;

    eventSource.onerror = (error) => {
      console.error('SSE 连接错误:', error);
    };

    // 清理函数
    return () => {
      eventSource.close();
    };
  }, [enabled, handleMessage]);
};

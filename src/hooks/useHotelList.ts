import { useState, useCallback, useEffect } from 'react';
import { message } from 'antd';
import { publicHotelApi } from '../services/api';
import type { Hotel } from '../services/api';

interface UseHotelListParams {
  keyword?: string;
  city?: string;
  starRating?: number;
  minPrice?: number;
  maxPrice?: number;
  facilitiesFilter?: string[];
  pageSize?: number;
}

/**
 * 酒店列表数据管理 Hook
 * 封装酒店列表的加载、分页、筛选等逻辑
 */
export const useHotelList = (params: UseHotelListParams) => {
  const {
    keyword = '',
    city = '',
    starRating = 0,
    minPrice,
    maxPrice,
    facilitiesFilter = [],
    pageSize = 10,
  } = params;

  const [list, setList] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  // 判断是否有前端筛选
  const hasFacilityFilter = facilitiesFilter.length > 0;

  // 判断是否还有更多数据
  const hasMore = hasFacilityFilter 
    ? page * pageSize < total
    : list.length < total;

  // 加载数据
  const loadPage = useCallback(
    async (pageNum: number, append: boolean) => {
      // 防止重复加载
      if (pageNum === 1) {
        if (loading) return;
        setLoading(true);
      } else {
        if (loadingMore) return;
        setLoadingMore(true);
      }
      setLoadError(null);
      
      try {
        const requestParams: any = { page: pageNum, pageSize };
        if (keyword.trim()) requestParams.keyword = keyword.trim();
        if (city.trim()) requestParams.city = city.trim();
        if (starRating > 0) requestParams.starRating = starRating;
        if (minPrice !== undefined) requestParams.minPrice = minPrice;
        if (maxPrice !== undefined) requestParams.maxPrice = maxPrice;
        
        const res = await publicHotelApi.getList(requestParams);
        let filteredData = res.data || [];
        
        // 前端根据设施筛选
        if (hasFacilityFilter) {
          filteredData = filteredData.filter((hotel) => {
            return facilitiesFilter.every((facility) => 
              hotel.facilities?.includes(facility)
            );
          });
        }
        
        if (append) {
          // 追加数据时去重
          setList((prev) => {
            const existingIds = new Set(prev.map(h => h.id));
            const newData = filteredData.filter(h => !existingIds.has(h.id));
            return [...prev, ...newData];
          });
        } else {
          setList(filteredData);
          // 首次加载时，无论是否有前端筛选，都设置后端返回的 total
          setTotal(res.total || 0);
        }
        
        setPage(pageNum);
      } catch (e) {
        const msg = (e as any)?.message || '加载失败';
        if (append) {
          message.error(msg);
        } else {
          setList([]);
          setLoadError(msg);
        }
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [keyword, city, starRating, minPrice, maxPrice, facilitiesFilter.join(','), pageSize],
  );

  // 初始加载
  useEffect(() => {
    loadPage(1, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keyword, city, starRating, minPrice, maxPrice, facilitiesFilter.join(',')]);

  // 加载更多
  const loadMore = useCallback(() => {
    if (!loadingMore && hasMore) {
      loadPage(page + 1, true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, hasMore, loadingMore]);

  // 重新加载
  const reload = useCallback(() => {
    loadPage(1, false);
  }, [loadPage]);

  return {
    list,
    loading,
    loadingMore,
    loadError,
    page,
    total,
    hasMore,
    hasFacilityFilter,
    loadMore,
    reload,
  };
};

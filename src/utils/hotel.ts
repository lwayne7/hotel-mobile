import type { Hotel } from '../services/api';

/**
 * 酒店相关工具函数
 */

/**
 * 提取快捷标签
 * @param hotels 酒店列表
 * @param limit 返回的标签数量限制
 * @returns 按出现频率排序的标签数组
 */
export const extractQuickTags = (hotels: Hotel[], limit: number = 5): string[] => {
  const facilityCount: Record<string, number> = {};
  
  hotels.forEach((hotel) => {
    hotel.facilities?.forEach((facility) => {
      facilityCount[facility] = (facilityCount[facility] || 0) + 1;
    });
  });
  
  return Object.entries(facilityCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([tag]) => tag);
};

/**
 * 模拟获取酒店点评统计数据
 * @param hotel 酒店对象
 * @returns 点评数和收藏数
 */
export const getReviewStats = (hotel: Hotel) => {
  const base = (hotel.id * 137) % 8000 + 1000;
  const reviews = base;
  const favorites = Math.floor(base * (1.2 + (hotel.id % 10) * 0.1));
  
  return {
    reviews,
    favorites: favorites >= 10000 
      ? (favorites / 10000).toFixed(1) + '万' 
      : String(favorites),
  };
};

/**
 * 获取评分标签
 * @param score 评分
 * @returns 评分标签文本
 */
export const getRatingLabel = (score: number): string => {
  if (score >= 4.8) return '超棒';
  if (score >= 4.5) return '很棒';
  if (score >= 4.0) return '不错';
  return '好评';
};

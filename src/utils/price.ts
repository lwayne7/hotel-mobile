/**
 * 价格相关工具函数
 */

/**
 * 解析价格区间字符串
 * @param range 价格区间字符串，如 "¥150-300"
 * @returns 最小价格和最大价格
 */
export const parsePriceRange = (range: string): { minPrice?: number; maxPrice?: number } => {
  if (!range || range === '不限') return {};
  if (range === '¥150以下') return { maxPrice: 150 };
  if (range === '¥600以上') return { minPrice: 600 };
  
  const match = range.match(/¥(\d+)-(\d+)/);
  if (match) {
    return {
      minPrice: Number(match[1]),
      maxPrice: Number(match[2]),
    };
  }
  
  return {};
};

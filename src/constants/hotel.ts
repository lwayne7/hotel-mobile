/**
 * 酒店相关常量
 */

// 排序选项（与后端 sortBy 参数对应）
export const SORT_OPTIONS = [
  { key: 'popular', label: '欢迎度排序' }, // 后端：按星级和更新时间排序
  { key: 'distance', label: '位置距离' },  // 后端：按更新时间排序（模拟距离）
  { key: 'price', label: '价格/星级' },    // 后端：按房型价格排序
  { key: 'filter', label: '筛选' },        // 前端：打开筛选面板
] as const;

// 热门城市列表
export const POPULAR_CITIES = [
  '北京', '上海', '广州', '深圳', '杭州', '成都', '西安', '三亚',
  '南京', '武汉', '厦门', '青岛', '重庆', '苏州', '长沙', '昆明',
] as const;

// 分页配置
export const PAGE_SIZE = 10;

// 虚拟列表配置
export const VIRTUAL_LIST_CONFIG = {
  ITEM_HEIGHT: 180, // 每个酒店卡片的固定高度（px）
  BUFFER_COUNT: 4,  // 缓冲区项数
  LOAD_MORE_OFFSET: 80, // 触发加载更多的距离阈值（px）
} as const;

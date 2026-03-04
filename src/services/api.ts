import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

const api = axios.create({
  baseURL: API_BASE_URL ? `${API_BASE_URL.replace(/\/$/, '')}/api` : '/api',
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

// 网络/代理失败时给出提示（如后端未启动）
api.interceptors.response.use(
  (r) => r,
  (err) => {
    const status = err.response?.status;
    const isConnectionError =
      err.code === 'ECONNABORTED' ||
      err.message?.includes('Network Error') ||
      err.message?.includes('ECONNREFUSED') ||
      status === 502 ||
      status === 503 ||
      status === 504;
    if (isConnectionError) {
      err.message =
        '无法连接服务，请先启动 hotel-management 后端：cd hotel-management/backend && npm run start:dev';
    }
    return Promise.reject(err);
  },
);

export interface Hotel {
  id: number;
  nameCn: string;
  nameEn?: string;
  address: string;
  starRating: number;
  openingDate?: string;
  description?: string;
  facilities?: string[];
  nearbyAttractions?: string[];
  transportation?: string[];
  status?: string;
  roomTypes?: any[];
  images?: any[];
}

/** 公共酒店列表查询参数 */
export interface PublicHotelListParams {
  page?: number;
  pageSize?: number;
  keyword?: string;
  city?: string;
  starRating?: number;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: string;
  accommodationType?: string; // 住宿类型筛选，逗号分隔
  facilities?: string; // 设施筛选，逗号分隔
  brands?: string; // 品牌筛选，逗号分隔
  hotelFeatures?: string; // 酒店特色，逗号分隔
  roomFeatures?: string; // 房间特色，逗号分隔
  tags?: string; // 热门标签筛选，逗号分隔
}

/** 公共酒店列表响应 */
export interface PublicHotelListResult {
  data: Hotel[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export const publicHotelApi = {
  getList: (params?: PublicHotelListParams): Promise<PublicHotelListResult> =>
    api.get('/public/hotels', { params }).then((r) => r.data),
  getById: (id: number): Promise<Hotel> => api.get(`/public/hotels/${id}`).then((r) => r.data),
};

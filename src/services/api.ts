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

export const publicHotelApi = {
  getList: (params?: {
    page?: number;
    pageSize?: number;
    keyword?: string;
    city?: string;
    starRating?: number;
    minPrice?: number;
    maxPrice?: number;
  }): Promise<{ data: Hotel[]; page: number; pageSize: number; total: number; totalPages: number }> =>
    api.get('/public/hotels', { params }).then((r) => r.data),
  getById: (id: number): Promise<Hotel> => api.get(`/public/hotels/${id}`).then((r) => r.data),
};

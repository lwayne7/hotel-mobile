import { createBrowserRouter } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { Spin } from 'antd';

/**
 * 路由配置（重构版）
 * 使用 pages_refactored 目录下的重构页面
 */

const Search = lazy(() => import('../pages_refactored/Search'));
const HotelList = lazy(() => import('../pages_refactored/HotelList'));
const VirtualHotelList = lazy(() => import('../pages_refactored/VirtualHotelList'));
const HotelDetail = lazy(() => import('../pages_refactored/HotelDetail'));

const LazyLoad = ({ children }: { children: React.ReactNode }) => (
  <Suspense
    fallback={
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spin size="large" />
      </div>
    }
  >
    {children}
  </Suspense>
);

/**
 * 路由配置
 * 
 * 切换列表模式：
 * - 普通列表：使用 HotelList
 * - 虚拟列表：使用 VirtualHotelList（推荐，性能更好）
 */
const router = createBrowserRouter([
  { 
    path: '/', 
    element: <LazyLoad><Search /></LazyLoad> 
  },
  { 
    path: '/hotels', 
    // 方式一：使用虚拟列表（推荐）
    element: <LazyLoad><VirtualHotelList /></LazyLoad> 
    // 方式二：使用普通列表
    // element: <LazyLoad><HotelList /></LazyLoad> 
  },
  { 
    path: '/hotels/:id', 
    element: <LazyLoad><HotelDetail /></LazyLoad> 
  },
]);

export default router;

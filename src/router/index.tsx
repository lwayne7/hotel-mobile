import { createBrowserRouter } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { Spin } from 'antd';

const Search = lazy(() => import('../pages/Search'));

// 普通列表（默认）
// const HotelList = lazy(() => import('../pages/HotelList'));

// 虚拟列表（性能优化版本）
// 如需启用虚拟列表，请将上面的 HotelList 导入注释掉，并取消下面这行的注释：
const HotelList = lazy(() => import('../pages/VirtualHotelList'));

const HotelDetail = lazy(() => import('../pages/HotelDetail'));

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

const router = createBrowserRouter([
  { path: '/', element: <LazyLoad><Search /></LazyLoad> },
  { path: '/hotels', element: <LazyLoad><HotelList /></LazyLoad> },
  { path: '/hotels/:id', element: <LazyLoad><HotelDetail /></LazyLoad> },
]);

export default router;

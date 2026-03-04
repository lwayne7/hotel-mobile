import { createBrowserRouter } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { Spin } from 'antd';

const Search = lazy(() => import('../pages/Search'));
const HotelList = lazy(() => import('../pages/HotelList'));
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

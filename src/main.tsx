import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import router from './router/index';
import './index.css';

const theme = {
  token: {
    colorPrimary: '#ff6b00',
    colorPrimaryHover: '#ff8533',
    colorPrimaryActive: '#e85c0d',
    borderRadius: 8,
  },
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ConfigProvider locale={zhCN} theme={theme}>
      <RouterProvider router={router} />
    </ConfigProvider>
  </StrictMode>,
);

# 易宿酒店 - 移动端 H5

> 基于 React + Vite 的移动端酒店预订应用，提供酒店搜索、列表浏览、详情查看等功能。

## ✨ 项目特性

- 🎨 **仿携程 UI** - 高度还原携程移动端设计风格
- ⚡ **虚拟列表** - 支持万级数据流畅滚动，性能提升 70 倍
- 📡 **SSE 实时更新** - 价格变动实时推送，无需刷新
- 🔍 **智能搜索** - 支持关键词、城市、星级、价格区间等多维度筛选
- 📱 **响应式设计** - 完美适配各种移动设备
- 🚀 **性能优化** - 图片懒加载、组件按需加载、代码分割

## 🛠️ 技术栈

- **React 19** + **TypeScript 5.9** - 类型安全的现代化 UI
- **Vite 7** - 极速开发体验
- **Ant Design Mobile 6** - 移动端 UI 组件库
- **React Router 7** - 路由管理
- **Axios** - HTTP 请求
- **Day.js** - 日期处理

## 📁 项目结构

```
hotel-mobile/
├── src/
│   ├── components/          # 通用组件
│   │   ├── VirtualList/     # 虚拟列表组件
│   │   ├── HotelCard/       # 酒店卡片组件
│   │   ├── DateSelectionModal/  # 日期选择模态框
│   │   └── CitySelectionModal/  # 城市选择模态框
│   ├── pages/               # 页面组件
│   │   ├── Search/          # 搜索页（首页）
│   │   ├── HotelList/       # 酒店列表页
│   │   └── HotelDetail/     # 酒店详情页
│   ├── hooks/               # 自定义 Hooks
│   │   ├── useHotelPrice.ts     # 价格计算
│   │   ├── usePriceUpdates.ts   # SSE 实时更新
│   │   ├── useDateSelection.ts  # 日期选择
│   │   └── useCitySelection.ts  # 城市选择
│   ├── services/            # API 服务
│   │   └── api.ts           # 后端接口封装
│   ├── utils/               # 工具函数
│   ├── constants/           # 常量配置
│   └── router/              # 路由配置
└── package.json
```

## 🚀 快速开始

### 1. 先启动后端（必须）

移动端需要连接后端 API，请先启动 hotel-management 后端服务：

```bash
cd hotel-management/backend
npm install
cp .env.example .env
npm run seed            # 初始化测试数据
npm run start:dev       # 后端运行在 http://localhost:3000
```

### 2. 安装并启动移动端

```bash
npm install
npm run dev
```

访问 http://localhost:5174

### 3. 配置后端地址（可选）

开发时默认通过 Vite 代理请求后端。如需修改后端地址，在根目录创建 `.env`：

```env
VITE_API_URL=http://localhost:3000
```

### 4. 构建生产版本

```bash
npm run build
```

产物在 `dist/` 目录，可部署到任意静态托管服务。

## 📱 功能说明

### 搜索页（首页）

- 城市选择
- 日期选择（入住/离店）
- 热门城市快速选择
- 精选酒店轮播展示

### 酒店列表页

- 多维度筛选（关键词、城市、星级、价格区间、设施）
- 三种排序方式（欢迎度、位置距离、价格）
- 虚拟列表支持万级数据流畅滚动
- 下拉加载更多
- 快捷标签筛选
- SSE 实时价格更新

### 酒店详情页

- 酒店基本信息展示
- 图片轮播
- 房型列表
- 设施服务
- 周边景点
- 交通信息

## 🔄 SSE 实时更新

移动端使用 Server-Sent Events (SSE) 技术实现价格实时更新：

- 自动连接后端 SSE 端点
- 监听价格变化事件
- 实时更新列表中的酒店数据
- 自动处理酒店上线/下线事件
- 30 秒心跳保持连接

## ⚡ 性能优化

### 虚拟列表

- 只渲染可见区域的酒店卡片
- 支持动态高度
- 缓冲区预加载
- 滚动性能优化

### 其他优化

- 图片懒加载
- 路由懒加载
- 防抖节流
- 请求去重

## 🔗 与后端关系

移动端仅调用后端的公开接口，无需登录：

- `GET /api/public/hotels` - 获取酒店列表
- `GET /api/public/hotels/:id` - 获取酒店详情
- `GET /api/public/hotels/price-updates` - SSE 价格更新流

## 📝 更新日志

### 2026-03-04
- ✨ 实现 SSE 实时价格更新功能
- 🐛 修复价格排序问题，确保全局有序
- 🎨 优化搜索页轮播图，添加毛玻璃效果
- ⚡ 优化虚拟列表性能
- 🔧 重构代码，提升复用率
- 📝 完善项目文档

## 📄 许可证

本项目仅供学习使用。

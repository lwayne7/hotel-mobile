# 🏨 易宿酒店预订 — H5 轻量版

> 基于 **Vite 7 + React 19 + Ant Design 6** 的用户端酒店预订流程，仅 H5 平台，适合快速预览与演示。
> 多端版本（H5 / 微信小程序 / RN）请移步 👉 [hotel-mobile-taro](https://github.com/lwayne7/hotel-mobile-taro)

---

## ✨ 项目亮点

| 亮点 | 说明 |
|------|------|
| ⚡ **极速启动** | Vite 7 毫秒级 HMR，零配置开发 |
| 🎨 **Ant Design 6** | 携程风格 UI，开箱即用的移动端组件 |
| 🔌 **纯公开接口** | 仅调用后端 Public API，无需登录即可浏览 |
| 📱 **移动端适配** | 响应式布局，适配各种手机屏幕 |

---

## 🛠️ 技术栈

| 技术 | 版本 |
|------|------|
| React | 19 |
| TypeScript | 5.9 |
| Vite | 7 |
| Ant Design | 6 |
| React Router | 7 |
| Axios | latest |

---

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

---

## 📄 路由

| 路径 | 页面 | 说明 |
|------|------|------|
| `/` | 酒店查询页 | 首页 — 城市 / 关键字 / 日期 / 筛选 |
| `/hotels` | 酒店列表 | 多维筛选 · 上滑加载更多 |
| `/hotels/:id` | 酒店详情 | 图片轮播 · 房型 · 价格 |

---

## 🚀 快速开始

### 1. 启动后端（必须）

```bash
cd ../hotel-management/backend
npm install
cp .env.example .env
npm run seed               # 初始化种子数据
npm run start:dev          # http://localhost:3000
```

### 2. 启动前端

```bash
npm install
npm run dev                # http://localhost:5174
```

开发时 `/api` 自动代理到 `http://localhost:3000`。

### 3. 构建

```bash
npm run build              # 产物在 dist/
```

---

## 🔗 相关项目

| 项目 | 说明 | 仓库 |
|------|------|------|
| **hotel-mobile-taro** ⭐ | 用户端 — Taro 多端（H5 / 微信小程序 / RN） | [GitHub](https://github.com/lwayne7/hotel-mobile-taro) |
| **hotel-management** | 管理系统（NestJS 后端 + React PC 前端） | [GitHub](https://github.com/lwayne7/hotel-management) |

---

## 📄 许可证

本项目仅供学习使用。

# 易宿酒店 - 用户端（移动端）Vite H5 版

用户端预定流程：酒店查询页、酒店列表页、酒店详情页。独立于管理端（hotel-management），与后端公开 API 对接。

**Taro 多端版（H5 / 微信小程序 / RN）** 已迁至独立仓库：[lwayne7/hotel-mobile-taro](https://github.com/lwayne7/hotel-mobile-taro)。

## 技术栈

- React 19 + TypeScript
- Vite 7
- Ant Design 6
- React Router 7
- Axios

## 路由

- `/` - 酒店查询页（首页）
- `/hotels` - 酒店列表（支持 keyword/city/starRating 等查询参数，上滑加载更多）
- `/hotels/:id` - 酒店详情

## 快速开始

### 1. 先启动后端（必须）

用户端请求会通过 Vite 代理到 `http://localhost:3000`，**请先启动 hotel-management 后端**，否则会出现 `ECONNREFUSED` / 代理错误：

```bash
cd hotel-management/backend
npm install
cp .env.example .env   # 配置数据库等
npm run seed            # 可选：初始化种子数据
npm run start:dev       # 后端运行在 http://localhost:3000
```

### 2. 安装并启动用户端

```bash
npm install
npm run dev
```

### 3. 配置后端地址（可选）

开发时默认通过 Vite 代理请求后端：`/api` 会转发到 `http://localhost:3000`。若后端在本机其他端口，可在根目录创建 `.env`：

```env
VITE_API_URL=http://localhost:3000
```

访问 http://localhost:5174（端口 5174，避免与管理端 5173 冲突）。

### 4. 构建

```bash
npm run build
```

产物在 `dist/`，可部署到任意静态托管。

## 与后端关系

- 仅调用 **公开接口**，无需登录：`GET /api/public/hotels`、`GET /api/public/hotels/:id`。
- 后端项目位于同仓库或同组织的 `hotel-management`，需先启动后端并执行种子数据（`npm run seed`）以便有已发布酒店可展示。

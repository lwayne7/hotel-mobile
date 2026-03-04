# HotelDetail 和 Search 页面重构说明

## 重构目标

避免过度封装，只封装真正需要复用的组件和逻辑。

## 新增组件

### 1. DateSelectionModal（日期选择弹窗）
- **路径**: `src/components/DateSelectionModal/`
- **功能**: 统一的入住/离店日期选择界面
- **Props**:
  - `open`: 是否显示
  - `checkIn/checkOut`: 入住/离店日期
  - `onCheckInChange/onCheckOutChange`: 日期变更回调
  - `onCancel/onConfirm`: 取消/确认回调

### 2. CitySelectionModal（城市选择弹窗）
- **路径**: `src/components/CitySelectionModal/`
- **功能**: 统一的城市选择界面
- **Props**:
  - `open`: 是否显示
  - `currentCity`: 当前选中城市
  - `cities`: 城市列表
  - `onCitySelect`: 城市选择回调
  - `onCancel`: 取消回调

## 新增 Hooks

### 1. useDateSelection（日期选择逻辑）
- **路径**: `src/hooks/useDateSelection.ts`
- **功能**: 封装入住/离店日期的选择逻辑
- **返回值**:
  - `checkIn/checkOut`: 入住/离店日期
  - `nights`: 住宿天数
  - `checkInLabel/checkOutLabel`: 日期标签（今天/明天）
  - `handleCheckInChange/handleCheckOutChange`: 日期变更处理
  - `setDates`: 同时设置两个日期

### 2. useCitySelection（城市选择逻辑）
- **路径**: `src/hooks/useCitySelection.ts`
- **功能**: 封装城市选择和 GPS 定位逻辑
- **返回值**:
  - `city`: 当前城市
  - `gpsLoading`: GPS 定位加载状态
  - `setCity`: 设置城市
  - `handleGpsLocation`: GPS 定位处理

## 页面重构

### HotelDetail 页面
- **移除**: `useHotelDetail` Hook（过度封装）
- **改为**: 直接在组件内使用 `publicHotelApi.getById()` 加载数据
- **使用**: `useDateSelection` Hook 和 `DateSelectionModal` 组件

### Search 页面
- **使用**: `useDateSelection` Hook 和 `DateSelectionModal` 组件
- **使用**: `useCitySelection` Hook 和 `CitySelectionModal` 组件
- **保持**: 其他业务逻辑在组件内部处理

## 设计原则

1. **只封装真正需要复用的部分**
   - 日期选择弹窗：HotelDetail 和 Search 都需要
   - 城市选择弹窗：Search 页面需要，可能其他页面也需要
   - 日期选择逻辑：多个页面共享相同的日期处理逻辑
   - 城市选择逻辑：包含 GPS 定位等复杂逻辑，值得封装

2. **避免过度抽象**
   - 不封装单一页面的业务逻辑
   - 不封装简单的数据加载（如 useHotelDetail）
   - 让组件保持一定的自主性和灵活性

3. **保持代码清晰**
   - 组件职责明确
   - Hook 功能单一
   - 业务逻辑就近原则

## 文件清单

### 新增文件
- `src/components/DateSelectionModal/index.tsx`
- `src/components/DateSelectionModal/index.css`
- `src/components/CitySelectionModal/index.tsx`
- `src/components/CitySelectionModal/index.css`
- `src/components/index.ts`
- `src/hooks/useDateSelection.ts`
- `src/hooks/useCitySelection.ts`

### 修改文件
- `src/hooks/index.ts` - 移除 useHotelDetail 导出
- `src/pages_refactored/HotelDetail/index.tsx` - 移除 useHotelDetail，直接加载数据
- `src/pages_refactored/Search/index.tsx` - 使用新组件和 Hooks

### 删除文件
- `src/hooks/useHotelDetail.ts` - 过度封装，已删除

## 使用示例

### 日期选择
```tsx
// 使用 Hook
const { checkIn, checkOut, nights, handleCheckInChange, handleCheckOutChange } = useDateSelection({
  initialCheckIn: '2024-03-01',
  initialCheckOut: '2024-03-02',
});

// 使用组件
<DateSelectionModal
  open={showDateModal}
  checkIn={checkIn}
  checkOut={checkOut}
  onCheckInChange={handleCheckInChange}
  onCheckOutChange={handleCheckOutChange}
  onCancel={() => setShowDateModal(false)}
  onConfirm={handleConfirm}
/>
```

### 城市选择
```tsx
// 使用 Hook
const { city, gpsLoading, setCity, handleGpsLocation } = useCitySelection({
  initialCity: '上海',
});

// 使用组件
<CitySelectionModal
  open={showCityModal}
  currentCity={city}
  cities={POPULAR_CITIES}
  onCitySelect={setCity}
  onCancel={() => setShowCityModal(false)}
/>
```

## 重构效果

- ✅ 移除过度封装，代码更清晰
- ✅ 保留真正需要复用的组件和逻辑
- ✅ 页面保持灵活性，易于维护
- ✅ 代码量适中，不过度抽象
- ✅ 符合单一职责原则

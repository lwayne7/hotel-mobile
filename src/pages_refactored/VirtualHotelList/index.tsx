import React, { useState, useCallback } from 'react';
import { Button, Spin, Empty, message, Modal, DatePicker, Input } from 'antd';
import { LeftOutlined, EnvironmentOutlined } from '@ant-design/icons';
import { useNavigate, useSearchParams } from 'react-router-dom';
import dayjs, { Dayjs } from 'dayjs';
import VirtualList from '../../components/VirtualList';
import HotelCard from '../../components/HotelCard';
import { useHotelList, useHotelPrice } from '../../hooks';
import { parsePriceRange, extractQuickTags } from '../../utils';
import { SORT_OPTIONS, POPULAR_CITIES, VIRTUAL_LIST_CONFIG } from '../../constants';
import './index.css';

const { ITEM_HEIGHT, BUFFER_COUNT, LOAD_MORE_OFFSET } = VIRTUAL_LIST_CONFIG;

/**
 * 虚拟列表版本的酒店列表页面（重构版）
 * 使用抽取的通用逻辑和组件
 */
const VirtualHotelListRefactored: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // URL 参数
  const keyword = searchParams.get('keyword') || '';
  const city = searchParams.get('city') || '上海';
  const starRating = Number(searchParams.get('starRating')) || 0;
  const priceRange = searchParams.get('priceRange') || '';
  const facilitiesFilter = searchParams.get('facilities')?.split(',').filter(Boolean) || [];
  
  // 日期参数
  const checkInParam = searchParams.get('checkIn');
  const checkOutParam = searchParams.get('checkOut');
  const checkIn = checkInParam ? dayjs(checkInParam) : dayjs();
  const checkOut = checkOutParam ? dayjs(checkOutParam) : dayjs().add(1, 'day');
  
  // 解析价格区间
  const { minPrice, maxPrice } = parsePriceRange(priceRange);
  
  // 使用自定义 Hooks
  const {
    list,
    loading,
    loadingMore,
    loadError,
    total,
    hasMore,
    hasFacilityFilter,
    loadMore,
    reload,
  } = useHotelList({
    keyword,
    city,
    starRating,
    minPrice,
    maxPrice,
    facilitiesFilter,
  });
  
  const { getMinPrice, getOriginalPrice } = useHotelPrice();
  
  // 本地状态
  const [quickTags, setQuickTags] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>(facilitiesFilter);
  const [sortBy, setSortBy] = useState('popular');
  
  // 弹窗状态
  const [showCityModal, setShowCityModal] = useState(false);
  const [showDateModal, setShowDateModal] = useState(false);
  const [showKeywordModal, setShowKeywordModal] = useState(false);
  const [tempCity, setTempCity] = useState(city);
  const [tempCheckIn, setTempCheckIn] = useState<Dayjs>(checkIn);
  const [tempCheckOut, setTempCheckOut] = useState<Dayjs>(checkOut);
  const [tempKeyword, setTempKeyword] = useState(keyword);

  // 提取快捷标签
  React.useEffect(() => {
    if (list.length > 0) {
      setQuickTags(extractQuickTags(list, 5));
    }
  }, [list]);

  // 排序处理
  const handleSort = (sortKey: string) => {
    setSortBy(sortKey);
    if (sortKey === 'filter') {
      message.info('筛选功能开发中');
      return;
    }
    
    // 这里可以调用后端排序接口，暂时使用前端排序
    message.info(`按${SORT_OPTIONS.find(o => o.key === sortKey)?.label}排序`);
  };

  // 快捷标签点击
  const handleTagClick = (tag: string) => {
    const isSelected = selectedTags.includes(tag);
    const newSelectedTags = isSelected
      ? selectedTags.filter((t) => t !== tag)
      : [...selectedTags, tag];
    
    setSelectedTags(newSelectedTags);
    
    const params = new URLSearchParams(searchParams.toString());
    if (newSelectedTags.length > 0) {
      params.set('facilities', newSelectedTags.join(','));
    } else {
      params.delete('facilities');
    }
    navigate(`/hotels?${params.toString()}`, { replace: true });
    window.location.reload();
  };

  // 渲染单个酒店卡片
  const renderHotelCard = useCallback((hotel: any) => {
    return (
      <HotelCard
        hotel={hotel}
        searchParams={searchParams.toString()}
        getMinPrice={getMinPrice}
        getOriginalPrice={getOriginalPrice}
      />
    );
  }, [searchParams, getMinPrice, getOriginalPrice]);

  // 城市选择确认
  const handleCityConfirm = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('city', tempCity);
    navigate(`/hotels?${params.toString()}`);
    setShowCityModal(false);
    window.location.reload();
  };

  // 日期选择确认
  const handleDateConfirm = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('checkIn', tempCheckIn.format('YYYY-MM-DD'));
    params.set('checkOut', tempCheckOut.format('YYYY-MM-DD'));
    navigate(`/hotels?${params.toString()}`);
    setShowDateModal(false);
    window.location.reload();
  };

  // 关键词搜索确认
  const handleKeywordConfirm = () => {
    const params = new URLSearchParams(searchParams.toString());
    if (tempKeyword.trim()) {
      params.set('keyword', tempKeyword.trim());
    } else {
      params.delete('keyword');
    }
    navigate(`/hotels?${params.toString()}`);
    setShowKeywordModal(false);
    window.location.reload();
  };

  return (
    <div className="ctrip-list ctrip-list-virtual">
      {/* Header */}
      <header className="ctrip-list-header-complex">
        <Button type="text" icon={<LeftOutlined />} onClick={() => navigate('/')} className="ctrip-back-btn" />
        <div className="ctrip-list-search-box">
          <div className="search-box-row" onClick={() => setShowDateModal(true)}>
            <span className="search-city" onClick={(e) => { e.stopPropagation(); setShowCityModal(true); }}>{city}</span>
            <span className="search-dates">{checkIn.format('MM-DD')} 住 {checkOut.format('MM-DD')} 离</span>
            <span className="search-nights">共{Math.max(1, checkOut.diff(checkIn, 'day'))}晚</span>
          </div>
          <div className="search-box-input" onClick={() => setShowKeywordModal(true)}>
            {keyword || '位置/品牌/酒店'}
          </div>
        </div>
        <div className="ctrip-list-map-icon" onClick={() => message.info('地图功能开发中')}>
          <EnvironmentOutlined />
          <span className="map-text">地图</span>
        </div>
      </header>

      {/* Filters */}
      <div className="ctrip-list-filters">
        {SORT_OPTIONS.map((opt) => (
          <span
            key={opt.key}
            className={`ctrip-list-filter-item ${sortBy === opt.key ? 'active' : ''}`}
            onClick={() => handleSort(opt.key)}
          >
            {opt.label}
          </span>
        ))}
      </div>
      
      {/* Count */}
      {!loading && !loadError && (list.length > 0 || total > 0) && (
        <div className="ctrip-list-count">
          共找到 <span className="count-num">{hasFacilityFilter ? list.length : total}</span> 家酒店
          {hasFacilityFilter && <span style={{ fontSize: '12px', color: '#999', marginLeft: '4px' }}>(已筛选)</span>}
          <span className="virtual-badge">虚拟列表·重构版</span>
        </div>
      )}
      
      {/* Quick Tags */}
      <div className="ctrip-list-quick-tags">
        {quickTags.map((tag) => (
          <span
            key={tag}
            className={`ctrip-list-quick-tag ${selectedTags.includes(tag) ? 'active' : ''}`}
            onClick={() => handleTagClick(tag)}
          >
            {tag}
          </span>
        ))}
      </div>

      {/* Content */}
      <div className="ctrip-list-content-virtual">
        {loading ? (
          <div className="ctrip-list-loading">
            <Spin size="large" />
          </div>
        ) : loadError ? (
          <div className="ctrip-empty">
            <div className="ctrip-empty-msg">{loadError}</div>
            <Button type="primary" onClick={reload} style={{ marginTop: 12 }}>
              重试
            </Button>
          </div>
        ) : list.length === 0 ? (
          <Empty description="暂无酒店" className="ctrip-empty" />
        ) : (
          <VirtualList
            data={list}
            itemHeight={ITEM_HEIGHT}
            containerHeight={window.innerHeight - 200}
            bufferCount={BUFFER_COUNT}
            renderItem={renderHotelCard}
            getItemKey={(hotel) => hotel.id}
            onLoadMore={loadMore}
            loadingMore={loadingMore}
            hasMore={hasMore}
            loadMoreOffset={LOAD_MORE_OFFSET}
            className="hotel-virtual-list"
            showDebug={false}
          />
        )}
      </div>

      {/* Modals */}
      <Modal
        title="选择城市"
        open={showCityModal}
        onCancel={() => setShowCityModal(false)}
        onOk={handleCityConfirm}
        okText="确定"
        cancelText="取消"
        centered
      >
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', padding: '12px 0' }}>
          {POPULAR_CITIES.map((c) => (
            <div
              key={c}
              onClick={() => setTempCity(c)}
              style={{
                padding: '8px',
                textAlign: 'center',
                background: tempCity === c ? '#e6f4ff' : '#f5f5f5',
                color: tempCity === c ? '#0086f6' : '#333',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: tempCity === c ? 600 : 400,
              }}
            >
              {c}
            </div>
          ))}
        </div>
      </Modal>

      <Modal
        title="选择入住和离店日期"
        open={showDateModal}
        onCancel={() => setShowDateModal(false)}
        onOk={handleDateConfirm}
        okText="确定"
        cancelText="取消"
        centered
        width={400}
      >
        <div style={{ padding: '12px 0' }}>
          <div style={{ marginBottom: '16px' }}>
            <div style={{ marginBottom: '8px', fontSize: '14px', color: '#666' }}>入住日期</div>
            <DatePicker
              value={tempCheckIn}
              onChange={(date) => {
                if (date) {
                  setTempCheckIn(date);
                  if (!tempCheckOut.isAfter(date, 'day')) {
                    setTempCheckOut(date.add(1, 'day'));
                  }
                }
              }}
              disabledDate={(current) => current < dayjs().startOf('day')}
              style={{ width: '100%' }}
              format="YYYY-MM-DD"
            />
          </div>
          <div>
            <div style={{ marginBottom: '8px', fontSize: '14px', color: '#666' }}>离店日期</div>
            <DatePicker
              value={tempCheckOut}
              onChange={(date) => date && setTempCheckOut(date)}
              disabledDate={(current) => current <= tempCheckIn}
              style={{ width: '100%' }}
              format="YYYY-MM-DD"
            />
          </div>
          <div style={{ marginTop: '12px', fontSize: '14px', color: '#0086f6', textAlign: 'center' }}>
            共 {Math.max(1, tempCheckOut.diff(tempCheckIn, 'day'))} 晚
          </div>
        </div>
      </Modal>

      <Modal
        title="搜索酒店"
        open={showKeywordModal}
        onCancel={() => setShowKeywordModal(false)}
        onOk={handleKeywordConfirm}
        okText="搜索"
        cancelText="取消"
        centered
      >
        <div style={{ padding: '12px 0' }}>
          <Input
            placeholder="输入位置/品牌/酒店名称"
            value={tempKeyword}
            onChange={(e) => setTempKeyword(e.target.value)}
            onPressEnter={handleKeywordConfirm}
            allowClear
            size="large"
          />
        </div>
      </Modal>
    </div>
  );
};

export default VirtualHotelListRefactored;

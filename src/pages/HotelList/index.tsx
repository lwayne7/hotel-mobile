import React, { useState, useCallback, useEffect } from 'react';
import { Button, Spin, Empty, message, Modal, Input } from 'antd';
import { LeftOutlined, EnvironmentOutlined } from '@ant-design/icons';
import { useNavigate, useSearchParams } from 'react-router-dom';
import dayjs, { Dayjs } from 'dayjs';
import VirtualList from '../../components/VirtualList';
import HotelCard from '../../components/HotelCard';
import DateSelectionModal from '../../components/DateSelectionModal';
import CitySelectionModal from '../../components/CitySelectionModal';
import { useHotelPrice } from '../../hooks';
import { publicHotelApi, Hotel } from '../../services/api';
import { parsePriceRange, extractQuickTags } from '../../utils';
import { SORT_OPTIONS, POPULAR_CITIES, VIRTUAL_LIST_CONFIG } from '../../constants';
import './index.css';

const { ITEM_HEIGHT, BUFFER_COUNT, LOAD_MORE_OFFSET } = VIRTUAL_LIST_CONFIG;

/**
 * 酒店列表页面
 * 
 * 功能特性：
 * 1. 虚拟列表优化大数据渲染性能
 * 2. 完全依赖后端 API 进行筛选、排序和分页
 * 3. 支持关键词搜索、城市筛选、星级筛选、价格区间筛选
 * 4. 支持设施快捷标签筛选
 * 5. 支持三种排序：欢迎度、位置距离、价格
 * 6. 无限滚动加载更多数据
 */
const HotelList: React.FC = () => {
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
  
  // 数据状态
  const [list, setList] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  
  const { getMinPrice, getOriginalPrice } = useHotelPrice();
  
  // 本地状态
  const [quickTags, setQuickTags] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>(facilitiesFilter);
  const [sortBy, setSortBy] = useState('popular');
  const [scrollResetTrigger, setScrollResetTrigger] = useState(0); // 滚动重置触发器
  
  // 弹窗状态
  const [showCityModal, setShowCityModal] = useState(false);
  const [showDateModal, setShowDateModal] = useState(false);
  const [showKeywordModal, setShowKeywordModal] = useState(false);
  const [tempCity, setTempCity] = useState(city);
  const [tempCheckIn, setTempCheckIn] = useState<Dayjs>(checkIn);
  const [tempCheckOut, setTempCheckOut] = useState<Dayjs>(checkOut);
  const [tempKeyword, setTempKeyword] = useState(keyword);

  // 判断是否还有更多数据
  const hasMore = list.length < total;

  // 加载数据
  const loadPage = useCallback(
    async (pageNum: number, append: boolean) => {
      // 防止重复加载
      if (pageNum === 1) {
        if (loading) return;
        setLoading(true);
      } else {
        if (loadingMore) return;
        setLoadingMore(true);
      }
      setLoadError(null);
      
      try {
        // 构建请求参数，完全依赖后端能力
        const params: any = { 
          page: pageNum, 
          pageSize: 10 
        };
        
        // 基础筛选参数
        if (keyword.trim()) params.keyword = keyword.trim();
        if (city.trim()) params.city = city.trim();
        if (starRating > 0) params.starRating = starRating;
        if (minPrice !== undefined) params.minPrice = minPrice;
        if (maxPrice !== undefined) params.maxPrice = maxPrice;
        
        // 排序参数（后端支持：price, popular, smart, distance）
        if (sortBy && sortBy !== 'popular') {
          params.sortBy = sortBy;
        }
        
        // 设施筛选（逗号分隔）
        if (facilitiesFilter.length > 0) {
          params.facilities = facilitiesFilter.join(',');
        }
        
        const res = await publicHotelApi.getList(params);
        const data = res.data || [];
        
        if (append) {
          // 追加数据时去重
          setList((prev) => {
            const existingIds = new Set(prev.map(h => h.id));
            const newData = data.filter(h => !existingIds.has(h.id));
            return [...prev, ...newData];
          });
        } else {
          setList(data);
          setTotal(res.total || 0);
        }
        
        setPage(pageNum);
      } catch (e) {
        const msg = (e as any)?.message || '加载失败';
        if (append) {
          message.error(msg);
        } else {
          setList([]);
          setLoadError(msg);
        }
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [keyword, city, starRating, minPrice, maxPrice, facilitiesFilter.join(','), sortBy],
  );

  // 初始加载
  useEffect(() => {
    loadPage(1, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keyword, city, starRating, minPrice, maxPrice, facilitiesFilter.join(','), sortBy]);;

  // 加载更多
  const loadMore = useCallback(() => {
    if (!loadingMore && hasMore) {
      loadPage(page + 1, true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, hasMore, loadingMore]);

  // 重新加载
  const reload = useCallback(() => {
    loadPage(1, false);
  }, [loadPage]);

  // 提取快捷标签
  React.useEffect(() => {
    if (list.length > 0) {
      setQuickTags(extractQuickTags(list, 5));
    }
  }, [list]);

  // 排序处理
  const handleSort = (sortKey: string) => {
    if (sortKey === 'filter') {
      message.info('筛选功能开发中');
      return;
    }
    
    setSortBy(sortKey);
    
    // 触发虚拟列表滚动重置
    setScrollResetTrigger(prev => prev + 1);
    
    message.success(`已按${SORT_OPTIONS.find(o => o.key === sortKey)?.label}排序`, 0.5);
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
          共找到 <span className="count-num">{total}</span> 家酒店
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
            resetScrollTrigger={scrollResetTrigger}
          />
        )}
      </div>

      {/* Modals */}
      {/* 城市选择模态框 */}
      <CitySelectionModal
        open={showCityModal}
        currentCity={tempCity}
        cities={POPULAR_CITIES}
        onCitySelect={(city) => {
          setTempCity(city);
          handleCityConfirm();
        }}
        onCancel={() => setShowCityModal(false)}
      />

      {/* 日期选择模态框 */}
      <DateSelectionModal
        open={showDateModal}
        checkIn={tempCheckIn}
        checkOut={tempCheckOut}
        onCheckInChange={(date) => {
          setTempCheckIn(date);
          if (!tempCheckOut.isAfter(date, 'day')) {
            setTempCheckOut(date.add(1, 'day'));
          }
        }}
        onCheckOutChange={(date) => setTempCheckOut(date)}
        onCancel={() => setShowDateModal(false)}
        onConfirm={handleDateConfirm}
      />

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

export default HotelList;

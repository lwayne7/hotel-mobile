import React, { useEffect, useState, useCallback } from 'react';
import { Button, Spin, Empty, message, Modal, DatePicker, Input } from 'antd';
import { LeftOutlined, EnvironmentOutlined } from '@ant-design/icons';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { publicHotelApi } from '../../services/api';
import type { Hotel } from '../../services/api';
import dayjs, { Dayjs } from 'dayjs';
import VirtualList from './VirtualList';
import './index.css';

const PAGE_SIZE = 10;
const ITEM_HEIGHT = 180; // 每个酒店卡片的固定高度（px）

const SORT_OPTIONS = [
  { key: 'popular', label: '欢迎度排序' },
  { key: 'distance', label: '位置距离' },
  { key: 'price', label: '价格/星级' },
  { key: 'filter', label: '筛选' },
];

// 模拟点评数、收藏数
const getReviewStats = (hotel: Hotel) => {
  const base = (hotel.id * 137) % 8000 + 1000;
  const reviews = base;
  const favorites = Math.floor(base * (1.2 + (hotel.id % 10) * 0.1));
  return { reviews, favorites: favorites >= 10000 ? (favorites / 10000).toFixed(1) + '万' : String(favorites) };
};

const getRatingLabel = (score: number) => {
  if (score >= 4.8) return '超棒';
  if (score >= 4.5) return '很棒';
  if (score >= 4.0) return '不错';
  return '好评';
};

const parsePriceRange = (range: string): { minPrice?: number; maxPrice?: number } => {
  if (!range || range === '不限') return {};
  if (range === '¥150以下') return { maxPrice: 150 };
  if (range === '¥600以上') return { minPrice: 600 };
  const match = range.match(/¥(\d+)-(\d+)/);
  if (match) return { minPrice: Number(match[1]), maxPrice: Number(match[2]) };
  return {};
};

const VirtualHotelList: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [list, setList] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [quickTags, setQuickTags] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>(
    searchParams.get('facilities')?.split(',').filter(Boolean) || []
  );
  const [sortBy, setSortBy] = useState('popular');
  
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
  
  // 弹窗状态
  const [showCityModal, setShowCityModal] = useState(false);
  const [showDateModal, setShowDateModal] = useState(false);
  const [showKeywordModal, setShowKeywordModal] = useState(false);
  const [tempCity, setTempCity] = useState(city);
  const [tempCheckIn, setTempCheckIn] = useState<Dayjs>(checkIn);
  const [tempCheckOut, setTempCheckOut] = useState<Dayjs>(checkOut);
  const [tempKeyword, setTempKeyword] = useState(keyword);

  // 判断是否还有更多数据
  // 如果有前端筛选，使用后端 total 判断（因为前端筛选后无法知道真实总数）
  // 如果无前端筛选，直接使用 list.length < total
  const hasFacilityFilter = facilitiesFilter.length > 0;
  const hasMore = hasFacilityFilter 
    ? page * PAGE_SIZE < total  // 前端筛选时，根据已加载的页数判断
    : list.length < total;       // 无筛选时，根据列表长度判断
  
  const { minPrice, maxPrice } = parsePriceRange(priceRange);

  // 辅助函数：获取酒店最低价格
  const getMinPrice = useCallback((hotel: Hotel) => {
    const prices = hotel.roomTypes?.map((r: any) => Number(r?.price)).filter((n: number) => !Number.isNaN(n) && n > 0) || [];
    return prices.length ? Math.min(...prices) : 999999;
  }, []);

  // 辅助函数：获取酒店原价
  const getOriginalPrice = useCallback((hotel: Hotel) => {
    const prices = hotel.roomTypes?.map((r: any) => Number(r?.originalPrice)).filter((n: number) => !Number.isNaN(n) && n > 0) || [];
    return prices.length ? Math.min(...prices) : 0;
  }, []);

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
        const params: any = { page: pageNum, pageSize: PAGE_SIZE };
        if (keyword.trim()) params.keyword = keyword.trim();
        if (city.trim()) params.city = city.trim();
        if (starRating > 0) params.starRating = starRating;
        if (minPrice !== undefined) params.minPrice = minPrice;
        if (maxPrice !== undefined) params.maxPrice = maxPrice;
        
        const res = await publicHotelApi.getList(params);
        let filteredData = res.data || [];
        const hasFacilityFilter = facilitiesFilter.length > 0;
        
        // 前端根据设施筛选
        if (hasFacilityFilter) {
          filteredData = filteredData.filter((hotel) => {
            return facilitiesFilter.every((facility) => 
              hotel.facilities?.includes(facility)
            );
          });
        }
        
        if (append) {
          // 追加数据时去重
          setList((prev) => {
            const existingIds = new Set(prev.map(h => h.id));
            const newData = filteredData.filter(h => !existingIds.has(h.id));
            return [...prev, ...newData];
          });
        } else {
          setList(filteredData);
          extractQuickTags(filteredData);
          // 首次加载时，无论是否有前端筛选，都设置后端返回的 total
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
    [keyword, city, starRating, minPrice, maxPrice, facilitiesFilter.join(',')],
  );

  // 提取快捷标签
  const extractQuickTags = (hotels: Hotel[]) => {
    const facilityCount: Record<string, number> = {};
    hotels.forEach((hotel) => {
      hotel.facilities?.forEach((facility) => {
        facilityCount[facility] = (facilityCount[facility] || 0) + 1;
      });
    });
    const sortedTags = Object.entries(facilityCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([tag]) => tag);
    setQuickTags(sortedTags);
  };

  // 排序处理
  const handleSort = (sortKey: string) => {
    setSortBy(sortKey);
    if (sortKey === 'filter') {
      message.info('筛选功能开发中');
      return;
    }
    
    const sorted = [...list].sort((a, b) => {
      if (sortKey === 'price') {
        return getMinPrice(a) - getMinPrice(b);
      }
      if (sortKey === 'distance') {
        return b.id - a.id;
      }
      return a.id - b.id;
    });
    
    setList(sorted);
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

  // 初始加载数据
  useEffect(() => {
    loadPage(1, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keyword, city, starRating, minPrice, maxPrice, facilitiesFilter.join(',')]);

  // 加载更多回调
  const handleLoadMore = useCallback(() => {
    if (!loadingMore && hasMore) {
      loadPage(page + 1, true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, hasMore, loadingMore]);

  // 渲染单个酒店卡片
  const renderHotelCard = useCallback((hotel: Hotel) => {
    const minPrice = getMinPrice(hotel);
    const originalPrice = getOriginalPrice(hotel);
    const score = ((hotel.id % 31) / 10 + 4.3).toFixed(1);
    const { reviews, favorites } = getReviewStats(hotel);
    const tags = hotel.facilities?.slice(0, 3) || ['免费WiFi', '免费停车'];
    const nearbyText = hotel.nearbyAttractions?.slice(0, 2).join('·') || hotel.address?.slice(0, 12) || '交通便利';
    
    return (
      <div
        className="ctrip-list-card"
        onClick={() => navigate(`/hotels/${hotel.id}?${searchParams.toString()}`)}
      >
        <div className="ctrip-list-card-cover">
          {hotel.images?.[0]?.imageUrl ? (
            <img src={hotel.images[0].imageUrl} alt={hotel.nameCn} loading="lazy" />
          ) : (
            <div className="ctrip-list-card-placeholder" />
          )}
          <div className="ctrip-video-icon">
            <span className="video-triangle">▶</span>
          </div>
        </div>
        
        <div className="ctrip-list-card-body">
          <div className="ctrip-list-card-name-row">
            <span className="ctrip-list-card-name">{hotel.nameCn}</span>
            {hotel.starRating >= 5 && <span className="ctrip-card-star">💎💎💎💎💎</span>}
          </div>

          <div className="ctrip-list-card-score-row">
            <div className="ctrip-score-box">
              <span className="score-num">{score}</span>
              <span className="score-label">{getRatingLabel(Number(score))}</span>
            </div>
            <span className="ctrip-score-text">{reviews}点评 · {favorites}收藏</span>
          </div>

          <div className="ctrip-list-card-nearby">{nearbyText}</div>

          <div className="ctrip-list-card-tags">
            {tags.map((t) => (
              <span key={t} className="ctrip-list-tag">{t}</span>
            ))}
          </div>

          <div className="ctrip-list-card-price-row">
            <div className="ctrip-price-block">
              <div className="price-top">
                <span className="currency">¥</span>
                <span className="price-val">{minPrice}</span>
                <span className="price-up">起</span>
              </div>
              {originalPrice > minPrice && (
                <div className="price-bottom">
                  <span className="price-diamond">钻石贵宾价</span>
                  <span className="price-del">¥{originalPrice}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }, [getMinPrice, getOriginalPrice, navigate, searchParams]);

  const POPULAR_CITIES = [
    '北京', '上海', '广州', '深圳', '杭州', '成都', '西安', '三亚',
    '南京', '武汉', '厦门', '青岛', '重庆', '苏州', '长沙', '昆明',
  ];

  const handleCityConfirm = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('city', tempCity);
    navigate(`/hotels?${params.toString()}`);
    setShowCityModal(false);
    window.location.reload();
  };

  const handleDateConfirm = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('checkIn', tempCheckIn.format('YYYY-MM-DD'));
    params.set('checkOut', tempCheckOut.format('YYYY-MM-DD'));
    navigate(`/hotels?${params.toString()}`);
    setShowDateModal(false);
    window.location.reload();
  };

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
          <span className="virtual-badge">虚拟列表</span>
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
            <Button type="primary" onClick={() => loadPage(1, false)} style={{ marginTop: 12 }}>
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
            bufferCount={4}
            renderItem={renderHotelCard}
            getItemKey={(hotel) => hotel.id}
            onLoadMore={handleLoadMore}
            loadingMore={loadingMore}
            hasMore={hasMore}
            loadMoreOffset={80}
            className="hotel-virtual-list"
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

export default VirtualHotelList;

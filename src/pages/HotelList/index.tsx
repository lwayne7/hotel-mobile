import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Button, Spin, Empty, message, Modal, DatePicker, Input } from 'antd';
import { LeftOutlined, EnvironmentOutlined } from '@ant-design/icons';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { publicHotelApi } from '../../services/api';
import type { Hotel } from '../../services/api';
import dayjs from 'dayjs';
import './index.css';

const PAGE_SIZE = 10;
const SORT_OPTIONS = [
  { key: 'popular', label: '欢迎度排序' },
  { key: 'distance', label: '位置距离' },
  { key: 'price', label: '价格/星级' },
  { key: 'filter', label: '筛选' },
];

// 模拟点评数、收藏数（无后端时用 id 生成）
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

// Parse price range string to minPrice/maxPrice
const parsePriceRange = (range: string): { minPrice?: number; maxPrice?: number } => {
  if (!range || range === '不限') return {};
  if (range === '¥150以下') return { maxPrice: 150 };
  if (range === '¥600以上') return { minPrice: 600 };
  const match = range.match(/¥(\d+)-(\d+)/);
  if (match) return { minPrice: Number(match[1]), maxPrice: Number(match[2]) };
  return {};
};

const HotelList: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [list, setList] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [quickTags, setQuickTags] = useState<string[]>([]);
  const [keyword] = useState(searchParams.get('keyword') || '');
  const [city] = useState(searchParams.get('city') || '上海');
  const [starRating] = useState(Number(searchParams.get('starRating')) || 0);
  const [priceRange] = useState(searchParams.get('priceRange') || '');
  const [facilitiesFilter] = useState(searchParams.get('facilities')?.split(',').filter(Boolean) || []);
  const [selectedTags, setSelectedTags] = useState<string[]>(searchParams.get('facilities')?.split(',').filter(Boolean) || []);
  const [sortBy, setSortBy] = useState('popular');
  
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
  const [tempCheckIn, setTempCheckIn] = useState(checkIn);
  const [tempCheckOut, setTempCheckOut] = useState(checkOut);
  const [tempKeyword, setTempKeyword] = useState(keyword);

  const hasMore = list.length < total;
  const containerRef = useRef<HTMLDivElement>(null);
  const loadingPageRef = useRef<number | null>(null); // 跟踪正在加载的页码,防止重复加载

  // Parse price range once
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

  const loadPage = useCallback(
    async (pageNum: number, append: boolean) => {
      // 防止重复加载同一页
      if (loadingPageRef.current === pageNum) {
        console.log(`页码 ${pageNum} 正在加载中,跳过重复请求`);
        return;
      }
      
      loadingPageRef.current = pageNum; // 标记正在加载
      
      if (pageNum === 1) setLoading(true);
      else setLoadingMore(true);
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
        
        // 前端根据设施筛选
        if (facilitiesFilter.length > 0) {
          filteredData = filteredData.filter((hotel) => {
            return facilitiesFilter.every((facility) => 
              hotel.facilities?.includes(facility)
            );
          });
        }
        
        if (append) {
          setList((prev) => {
            console.log(`追加数据: 原有${prev.length}条, 新增${filteredData.length}条`);
            return [...prev, ...filteredData];
          });
        } else {
          setList(filteredData);
          // 从酒店数据中提取常见设施作为快捷标签
          extractQuickTags(filteredData);
        }
        setTotal(facilitiesFilter.length > 0 ? filteredData.length : (res.total || 0));
        setPage(pageNum);
      } catch (e) {
        const msg = (e as any)?.message || '加载失败，请检查网络或稍后重试';
        if (append) {
          message.error(msg);
          setList((prev) => prev);
        } else {
          setList([]);
          setLoadError(msg);
        }
      } finally {
        setLoading(false);
        setLoadingMore(false);
        loadingPageRef.current = null; // 清除加载标记
      }
    },
    [keyword, city, starRating, minPrice, maxPrice, facilitiesFilter],
  );

  // 从酒店列表中提取常见设施作为快捷标签
  const extractQuickTags = (hotels: Hotel[]) => {
    const facilityCount: Record<string, number> = {};
    hotels.forEach((hotel) => {
      hotel.facilities?.forEach((facility) => {
        facilityCount[facility] = (facilityCount[facility] || 0) + 1;
      });
    });
    // 按出现频率排序，取前5个
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
    
    // 对当前列表进行排序
    const sorted = [...list].sort((a, b) => {
      if (sortKey === 'price') {
        const priceA = getMinPrice(a);
        const priceB = getMinPrice(b);
        console.log(`排序: ${a.nameCn} (¥${priceA}) vs ${b.nameCn} (¥${priceB})`);
        // 价格从低到高排序
        return priceA - priceB;
      }
      if (sortKey === 'distance') {
        // 位置距离排序（按 ID 降序，模拟距离远近）
        // ID 越大表示距离越近
        return b.id - a.id;
      }
      // popular - 欢迎度排序（按 ID 升序）
      // ID 越小表示越受欢迎
      return a.id - b.id;
    });
    
    console.log('排序后列表:', sorted.map(h => `${h.nameCn}: ¥${getMinPrice(h)}`));
    setList(sorted);
  };

  // 快捷标签点击处理
  const handleTagClick = (tag: string) => {
    const isSelected = selectedTags.includes(tag);
    let newSelectedTags: string[];
    if (isSelected) {
      newSelectedTags = selectedTags.filter((t) => t !== tag);
    } else {
      newSelectedTags = [...selectedTags, tag];
    }
    setSelectedTags(newSelectedTags);
    
    // 更新URL参数并重新加载
    const params = new URLSearchParams(searchParams.toString());
    if (newSelectedTags.length > 0) {
      params.set('facilities', newSelectedTags.join(','));
    } else {
      params.delete('facilities');
    }
    navigate(`/hotels?${params.toString()}`, { replace: true });
    
    // 重新加载数据
    window.location.reload();
  };

  useEffect(() => {
    loadPage(1, false);
  }, [loadPage]);

  const handleScroll = useCallback(() => {
    const el = containerRef.current;
    if (!el || loadingMore || !hasMore || list.length === 0) return;
    const { scrollTop, scrollHeight, clientHeight } = el;
    if (scrollTop + clientHeight >= scrollHeight - 80) loadPage(page + 1, true);
  }, [page, hasMore, loadingMore, list.length, loadPage]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener('scroll', handleScroll, { passive: true });
    return () => el.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  const getTags = (hotel: Hotel) => {
    const tags: string[] = [];
    if (hotel.facilities?.length) tags.push(...hotel.facilities.slice(0, 4));
    if (tags.length === 0) tags.push('免费WiFi', '免费停车', '含早');
    return tags.slice(0, 4);
  };

  const getScore = (hotel: Hotel) => {
    const s = (hotel.id % 31) / 10 + 4.3;
    return Math.min(5, Math.round(s * 10) / 10);
  };

  const getNearbyText = (hotel: Hotel) => {
    const att = hotel.nearbyAttractions?.slice(0, 2).join('·') || hotel.address?.slice(0, 12) || '交通便利';
    return att.length > 20 ? att.slice(0, 20) + '…' : att;
  };

  const goToMap = () => {
    navigate(`/hotels?${searchParams.toString()}&map=1`);
    // 若后续有地图页可跳转
  };

  // 城市选择
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

  // 日期选择
  const handleDateConfirm = () => {
    const params = new URLSearchParams(searchParams.toString());
    if (tempCheckIn) params.set('checkIn', tempCheckIn.format('YYYY-MM-DD'));
    if (tempCheckOut) params.set('checkOut', tempCheckOut.format('YYYY-MM-DD'));
    navigate(`/hotels?${params.toString()}`);
    setShowDateModal(false);
    window.location.reload();
  };

  // 关键词搜索
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
    <div className="ctrip-list" ref={containerRef}>
      {/* Consolidated Header */}
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
        <div className="ctrip-list-map-icon" onClick={goToMap}>
          <EnvironmentOutlined />
          <span className="map-text">地图</span>
        </div>
      </header>

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
      
      {/* 显示酒店数量 */}
      {!loading && !loadError && total > 0 && (
        <div className="ctrip-list-count">
          共找到 <span className="count-num">{total}</span> 家酒店
        </div>
      )}
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

      <div className="ctrip-list-content">
        {loading ? (
          <div className="ctrip-list-loading">
            <Spin size="large" />
          </div>
        ) : loadError ? (
          <div className="ctrip-empty">
            <div className="ctrip-empty-msg">{loadError}</div>
            <div className="ctrip-empty-hint">请确认已启动后端：cd hotel-management/backend && npm run start:dev</div>
            <Button type="primary" onClick={() => loadPage(1, false)} style={{ marginTop: 12 }}>
              重试
            </Button>
          </div>
        ) : list.length === 0 ? (
          <Empty description="暂无酒店" className="ctrip-empty" />
        ) : (
          <>
            {list.map((hotel) => {
              const minPrice = getMinPrice(hotel);
              const originalPrice = getOriginalPrice(hotel);
              const tags = getTags(hotel);
              const score = getScore(hotel);
              const { reviews, favorites } = getReviewStats(hotel);
              const nearbyText = getNearbyText(hotel);
              return (
                <div
                  key={hotel.id}
                  className="ctrip-list-card"
                  onClick={() => navigate(`/hotels/${hotel.id}?${searchParams.toString()}`)}
                >
                  <div className="ctrip-list-card-cover">
                    {hotel.images?.[0]?.imageUrl ? (
                      <img src={hotel.images[0].imageUrl} alt={hotel.nameCn} />
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
                        <span className="score-label">{getRatingLabel(score)}</span>
                      </div>
                      <span className="ctrip-score-text">{reviews}点评 · {favorites}收藏</span>
                    </div>

                    <div className="ctrip-list-card-nearby">
                      {nearbyText}
                    </div>

                    <div className="ctrip-list-card-tags">
                      {tags.slice(0, 3).map((t) => (
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
            })}
            {loadingMore && (
              <div className="ctrip-list-more">
                <Spin />
              </div>
            )}
            {!loadingMore && hasMore && list.length > 0 && (
              <div className="ctrip-list-more-hint">上滑加载更多</div>
            )}
          </>
        )}
      </div>

      {/* 城市选择弹窗 */}
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

      {/* 日期选择弹窗 */}
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
                  if (!tempCheckOut || !tempCheckOut.isAfter(date, 'day')) {
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
              disabledDate={(current) => !!tempCheckIn && current <= tempCheckIn}
              style={{ width: '100%' }}
              format="YYYY-MM-DD"
            />
          </div>
          <div style={{ marginTop: '12px', fontSize: '14px', color: '#0086f6', textAlign: 'center' }}>
            共 {tempCheckIn && tempCheckOut ? Math.max(1, tempCheckOut.diff(tempCheckIn, 'day')) : 0} 晚
          </div>
        </div>
      </Modal>

      {/* 关键词搜索弹窗 */}
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

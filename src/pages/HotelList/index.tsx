import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Button, Spin, Empty, message } from 'antd';
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
  const checkInParam = searchParams.get('checkIn');
  const checkOutParam = searchParams.get('checkOut');
  const checkIn = checkInParam ? dayjs(checkInParam) : dayjs();
  const checkOut = checkOutParam ? dayjs(checkOutParam) : dayjs().add(1, 'day');

  const hasMore = list.length < total;
  const containerRef = useRef<HTMLDivElement>(null);

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
          setList((prev) => [...prev, ...filteredData]);
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
        // 模拟距离排序（实际需要地理位置数据）
        return a.id - b.id;
      }
      // popular - 默认排序（按ID）
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

  return (
    <div className="ctrip-list" ref={containerRef}>
      {/* Consolidated Header */}
      <header className="ctrip-list-header-complex">
        <Button type="text" icon={<LeftOutlined />} onClick={() => navigate('/')} className="ctrip-back-btn" />
        <div className="ctrip-list-search-box">
          <div className="search-box-row">
            <span className="search-city">{city}</span>
            <span className="search-dates">{checkIn.format('MM-DD')} 住 {checkOut.format('MM-DD')} 离</span>
            <span className="search-nights">共{Math.max(1, checkOut.diff(checkIn, 'day'))}晚</span>
          </div>
          <div className="search-box-input">
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
                      <span className="ctrip-tag-boss">BOSS推荐</span>
                      {tags.slice(0, 2).map((t) => (
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
    </div>
  );
};

export default HotelList;

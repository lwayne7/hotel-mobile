import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Button, Spin, Empty } from 'antd';
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
const QUICK_TAGS = ['外滩', '双床房', '含早餐', '免费兑早餐', '可订'];

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

const HotelList: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [list, setList] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [keyword] = useState(searchParams.get('keyword') || '');
  const [city] = useState(searchParams.get('city') || '上海');
  const [starRating] = useState(Number(searchParams.get('starRating')) || 0);
  const [sortBy, setSortBy] = useState('popular');
  const checkInParam = searchParams.get('checkIn');
  const checkOutParam = searchParams.get('checkOut');
  const checkIn = checkInParam ? dayjs(checkInParam) : dayjs();
  const checkOut = checkOutParam ? dayjs(checkOutParam) : dayjs().add(1, 'day');

  const hasMore = list.length < total;
  const containerRef = useRef<HTMLDivElement>(null);

  const loadPage = useCallback(
    async (pageNum: number, append: boolean) => {
      if (pageNum === 1) setLoading(true);
      else setLoadingMore(true);
      try {
        const params: any = { page: pageNum, pageSize: PAGE_SIZE };
        if (keyword.trim()) params.keyword = keyword.trim();
        if (city.trim()) params.city = city.trim();
        if (starRating > 0) params.starRating = starRating;
        const res = await publicHotelApi.getList(params);
        if (append) {
          setList((prev) => [...prev, ...(res.data || [])]);
        } else {
          setList(res.data || []);
        }
        setTotal(res.total || 0);
        setPage(pageNum);
      } catch (e) {
        if (append) setList((prev) => prev);
        else setList([]);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [keyword, city, starRating],
  );

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

  const getMinPrice = (hotel: Hotel) => {
    const prices = hotel.roomTypes?.map((r: any) => Number(r?.price)).filter((n: number) => !Number.isNaN(n)) || [];
    return prices.length ? Math.min(...prices) : 0;
  };

  const getOriginalPrice = (hotel: Hotel) => {
    const prices = hotel.roomTypes?.map((r: any) => Number(r?.originalPrice)).filter((n: number) => !Number.isNaN(n) && n > 0) || [];
    return prices.length ? Math.min(...prices) : 0;
  };

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
            onClick={() => setSortBy(opt.key)}
          >
            {opt.label}
          </span>
        ))}
      </div>
      <div className="ctrip-list-quick-tags">
        {QUICK_TAGS.map((tag) => (
          <span key={tag} className="ctrip-list-quick-tag">
            {tag}
          </span>
        ))}
      </div>

      <div className="ctrip-list-content">
        {loading ? (
          <div className="ctrip-list-loading">
            <Spin size="large" />
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
                      <span className="ctrip-score-text">{reviews}点评 · {favorites}收藏 · "{getRatingLabel(score)}推荐"</span>
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

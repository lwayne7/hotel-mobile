import React, { useState, useEffect } from 'react';
import { Input, Button, Typography, message, Modal, Segmented, Carousel } from 'antd';
import { EnvironmentOutlined, CalendarOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { publicHotelApi } from '../../services/api';
import { useDateSelection, useCityLocation } from '../../hooks';
import { extractQuickTags } from '../../utils/hotel';
import DateSelectionModal from '../../components/DateSelectionModal';
import CitySelectionModal from '../../components/CitySelectionModal';
import { POPULAR_CITIES } from '../../constants/hotel';
import './index.css';

const { Title } = Typography;

const TABS = [
  { key: 'domestic', label: '国内' },
  { key: 'overseas', label: '海外' },
  { key: 'hourly', label: '钟点房' },
  { key: 'homestay', label: '民宿' },
];

const STAR_OPTIONS = [
  { value: 0, label: '不限' },
  { value: 2, label: '经济型' },
  { value: 3, label: '舒适型' },
  { value: 4, label: '高档型' },
  { value: 5, label: '豪华型' },
];

const PRICE_OPTIONS = ['不限', '¥150以下', '¥150-300', '¥300-450', '¥450-600', '¥600以上'];

const Search: React.FC = () => {
  const navigate = useNavigate();
  
  // 使用日期选择 Hook
  const {
    checkIn,
    checkOut,
    nights,
    checkInLabel,
    checkOutLabel,
    handleCheckInChange,
    handleCheckOutChange,
  } = useDateSelection();
  
  // 使用城市定位 Hook
  const { city, province, loading: gpsLoading, error: locationError, locate } = useCityLocation();
  
  // 城市状态
  const [selectedCity, setSelectedCity] = useState(city);
  
  const [activeTab, setActiveTab] = useState('domestic');
  const [keyword, setKeyword] = useState('');
  const [starRating, setStarRating] = useState<number>(0);
  const [priceRange, setPriceRange] = useState<string>('不限');
  const [bannerHotels, setBannerHotels] = useState<any[]>([]);
  const [showDateModal, setShowDateModal] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showCityModal, setShowCityModal] = useState(false);
  const [quickTags, setQuickTags] = useState<string[]>([]);
  
  // 临时日期状态（用于模态框）
  const [tempCheckIn, setTempCheckIn] = useState(checkIn);
  const [tempCheckOut, setTempCheckOut] = useState(checkOut);

  useEffect(() => {
    // 根据城市加载推荐酒店（用于轮播广告）
    const loadRecommendHotels = () => {
      const params: any = { page: 1, pageSize: 5 }; // 只加载5个用于轮播
      if (selectedCity) {
        params.city = selectedCity;
      }
      publicHotelApi
        .getList(params)
        .then((res) => {
          setBannerHotels(res.data || []);
          // 提取常见设施作为快捷标签
          const tags = extractQuickTags(res.data || []);
          setQuickTags(tags);
        })
        .catch((e: any) => message.error(e?.message || '加载失败'));
    };
    
    loadRecommendHotels();
  }, [selectedCity]); // 依赖城市变化

  // 监听定位结果
  useEffect(() => {
    if (city && !gpsLoading && !locationError) {
      setSelectedCity(city);
    }
  }, [city, gpsLoading, locationError]);

  // 监听定位错误
  useEffect(() => {
    if (locationError) {
      message.error(locationError);
    }
  }, [locationError]);

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (keyword.trim()) params.set('keyword', keyword.trim());
    if (selectedCity.trim()) params.set('city', selectedCity.trim());
    if (checkIn) params.set('checkIn', checkIn.format('YYYY-MM-DD'));
    if (checkOut) params.set('checkOut', checkOut.format('YYYY-MM-DD'));
    if (starRating > 0) params.set('starRating', String(starRating));
    if (priceRange !== '不限') params.set('priceRange', priceRange);
    navigate(`/hotels?${params.toString()}`);
  };

  const setCityAndSearch = (c: string) => {
    setSelectedCity(c);
    navigate(`/hotels?city=${encodeURIComponent(c)}`);
  };

  const toggleTag = (tag: string) => {
    // 点击标签后立即跳转到列表页
    const params = new URLSearchParams();
    if (selectedCity.trim()) params.set('city', selectedCity.trim());
    if (checkIn) params.set('checkIn', checkIn.format('YYYY-MM-DD'));
    if (checkOut) params.set('checkOut', checkOut.format('YYYY-MM-DD'));
    // 设置设施筛选参数
    params.set('facilities', tag);
    navigate(`/hotels?${params.toString()}`);
  };

  // GPS 定位处理
  const handleGpsLocation = () => {
    if (gpsLoading) return;
    locate();
  };

  // 打开日期选择弹窗
  const handleDateClick = () => {
    setTempCheckIn(checkIn);
    setTempCheckOut(checkOut);
    setShowDateModal(true);
  };

  // 日期选择确认处理
  const handleDateConfirm = () => {
    handleCheckInChange(tempCheckIn);
    handleCheckOutChange(tempCheckOut);
    setShowDateModal(false);
  };

  const getFilterSummary = () => {
    const parts = [];
    const starLabel = STAR_OPTIONS.find((s) => s.value === starRating)?.label;
    if (starRating > 0 && starLabel) parts.push(starLabel);
    if (priceRange !== '不限') parts.push(priceRange);
    return parts.length > 0 ? parts.join('/') : '';
  };

  return (
    <div className="ctrip-search">
      <header className="ctrip-search-header">
        <div className="ctrip-search-page-title">酒店查询页</div>
      </header>

      {/* 酒店广告轮播 */}
      {bannerHotels.length > 0 && (
        <div className="ctrip-search-banner-wrap">
          <Carousel autoplay autoplaySpeed={3000} dots={{ className: 'banner-dots' }}>
            {bannerHotels.map((hotel) => (
              <div key={hotel.id}>
                <div
                  className="ctrip-search-banner-hotel"
                  onClick={() => navigate(`/hotels/${hotel.id}`)}
                >
                  {/* 左侧酒店图片 */}
                  <div className="banner-hotel-image">
                    {hotel.images?.[0]?.imageUrl ? (
                      <img src={hotel.images[0].imageUrl} alt={hotel.nameCn} />
                    ) : (
                      <div className="banner-hotel-placeholder" />
                    )}
                    <div className="banner-hotel-badge">推荐</div>
                  </div>
                  
                  {/* 右侧酒店信息 */}
                  <div className="banner-hotel-info">
                    <div className="banner-hotel-name">{hotel.nameCn}</div>
                    <div className="banner-hotel-rating">
                      {hotel.starRating >= 5 && <span className="rating-stars">💎💎💎💎💎</span>}
                      {hotel.starRating === 4 && <span className="rating-stars">⭐⭐⭐⭐</span>}
                      {hotel.starRating === 3 && <span className="rating-stars">⭐⭐⭐</span>}
                    </div>
                    <div className="banner-hotel-address">
                      📍 {hotel.address?.slice(0, 20)}
                      {hotel.address && hotel.address.length > 20 ? '...' : ''}
                    </div>
                    <div className="banner-hotel-price">
                      <span className="price-label">特惠价</span>
                      <span className="price-value">
                        ¥{hotel.roomTypes?.[0]?.price || '--'}
                      </span>
                      <span className="price-unit">起</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </Carousel>
        </div>
      )}

      {/* 搜索卡片容器 */}
      <div className="ctrip-search-card">
        {/* Tab：国内/海外/钟点房/民宿 */}
        <div className="ctrip-search-tabs">
          {TABS.map((tab) => (
            <div
              key={tab.key}
              className={`ctrip-search-tab ${activeTab === tab.key ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
              {activeTab === tab.key && <div className="active-indicator" />}
            </div>
          ))}
        </div>

        <div className="ctrip-search-form">
          <div className="ctrip-search-row city-row">
            <div className="ctrip-search-city" onClick={() => setShowCityModal(true)}>
              <span className="city-text">{selectedCity || '选择城市'}</span>
            </div>
            <div className="ctrip-search-input-wrap">
              <Input
                placeholder="位置/品牌/酒店"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                allowClear
                className="ctrip-search-input-clean"
                variant="borderless"
              />
            </div>
            <div
              className={`ctrip-search-gps ${gpsLoading ? 'loading' : ''}`}
              onClick={handleGpsLocation}
            >
              <span className="gps-text">{gpsLoading ? '定位中...' : '我的位置'}</span>
              <EnvironmentOutlined spin={gpsLoading} />
            </div>
          </div>

          <div className="ctrip-search-divider" />

          {/* 日期选择 */}
          <div className="ctrip-search-row date-row">
            <div className="date-col" onClick={handleDateClick}>
              <span className="date-label">入住</span>
              <div className="date-val-row">
                <span className="date-val">{checkIn.format('MM月DD日')}</span>
                <span className="date-sub">{checkInLabel}</span>
                <CalendarOutlined className="date-icon" />
              </div>
            </div>
            <div className="date-nights">
              {nights}晚
            </div>
            <div className="date-col" onClick={handleDateClick}>
              <span className="date-label">离店</span>
              <div className="date-val-row">
                <span className="date-val">{checkOut.format('MM月DD日')}</span>
                <span className="date-sub">{checkOutLabel}</span>
                <CalendarOutlined className="date-icon" />
              </div>
            </div>
          </div>

          <div className="ctrip-search-divider" />

          {/* 价格/星级筛选 */}
          <div className="ctrip-search-row price-row">
            <div className="price-input" onClick={() => setShowFilterModal(true)}>
              <span className="price-val">价格/星级</span>
              <span className="price-sub">{getFilterSummary()}</span>
            </div>
            <div className="quick-tags-clean">
              {quickTags.map((t) => (
                <span
                  key={t}
                  className="quick-tag-item"
                  onClick={() => toggleTag(t)}
                >
                  {t}
                </span>
              ))}
            </div>
          </div>

          <div className="ctrip-search-btn-wrap">
            <Button type="primary" block className="ctrip-btn-search-submit" onClick={handleSearch}>
              查询
            </Button>
          </div>
        </div>
      </div>

      <section className="ctrip-section">
        <Title level={5} className="ctrip-section-title">热门城市</Title>
        <div className="ctrip-city-chips">
          {POPULAR_CITIES.map((c: string) => (
            <span key={c} className="ctrip-chip" onClick={() => setCityAndSearch(c)}>
              {c}
            </span>
          ))}
        </div>
      </section>

      {/* 日期选择弹窗 */}
      <DateSelectionModal
        open={showDateModal}
        checkIn={tempCheckIn}
        checkOut={tempCheckOut}
        onCheckInChange={(date) => {
          setTempCheckIn(date);
          // 如果离店日期不在入住日期之后,自动设置为入住日期+1天
          if (!tempCheckOut.isAfter(date, 'day')) {
            setTempCheckOut(date.add(1, 'day'));
          }
        }}
        onCheckOutChange={setTempCheckOut}
        onCancel={() => setShowDateModal(false)}
        onConfirm={handleDateConfirm}
      />

      {/* 星级/价格筛选弹窗 */}
      <Modal
        title="筛选条件"
        open={showFilterModal}
        onCancel={() => {
          setStarRating(0);
          setPriceRange('不限');
          setShowFilterModal(false);
        }}
        onOk={() => setShowFilterModal(false)}
        okText="确定"
        cancelText="重置"
        centered
        className="ctrip-filter-modal"
      >
        <div className="filter-section">
          <div className="filter-label">酒店星级</div>
          <Segmented
            options={STAR_OPTIONS.map((s) => ({ value: s.value, label: s.label }))}
            value={starRating}
            onChange={(v) => setStarRating(v as number)}
            block
          />
        </div>
        <div className="filter-section">
          <div className="filter-label">价格区间</div>
          <div className="filter-price-tags">
            {PRICE_OPTIONS.map((p) => (
              <span
                key={p}
                className={`filter-price-tag ${priceRange === p ? 'active' : ''}`}
                onClick={() => setPriceRange(p)}
              >
                {p}
              </span>
            ))}
          </div>
        </div>
      </Modal>

      {/* 城市选择弹窗 */}
      <CitySelectionModal
        open={showCityModal}
        currentCity={selectedCity}
        cities={POPULAR_CITIES}
        onCitySelect={setSelectedCity}
        onCancel={() => setShowCityModal(false)}
      />
    </div>
  );
};

export default Search;

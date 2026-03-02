import React, { useState, useEffect } from 'react';
import { Input, Button, Typography, message, DatePicker, Modal, Segmented } from 'antd';
import { EnvironmentOutlined, CalendarOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { publicHotelApi } from '../../services/api';
import { useDateSelection, useCitySelection } from '../../hooks';
import { extractQuickTags } from '../../utils/hotelUtils';
import DateSelectionModal from '../../components/DateSelectionModal';
import CitySelectionModal from '../../components/CitySelectionModal';
import { POPULAR_CITIES } from '../../constants/hotelConstants';
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
  
  // 使用城市选择 Hook
  const { city, gpsLoading, setCity, handleGpsLocation } = useCitySelection({
    initialCity: '上海',
  });
  
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
    // 根据城市加载推荐酒店
    const loadRecommendHotels = () => {
      const params: any = { page: 1, pageSize: 20 };
      if (city) {
        params.city = city;
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
  }, [city]); // 依赖城市变化

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (keyword.trim()) params.set('keyword', keyword.trim());
    if (city.trim()) params.set('city', city.trim());
    if (checkIn) params.set('checkIn', checkIn.format('YYYY-MM-DD'));
    if (checkOut) params.set('checkOut', checkOut.format('YYYY-MM-DD'));
    if (starRating > 0) params.set('starRating', String(starRating));
    if (priceRange !== '不限') params.set('priceRange', priceRange);
    navigate(`/hotels?${params.toString()}`);
  };

  const setCityAndSearch = (c: string) => {
    setCity(c);
    navigate(`/hotels?city=${encodeURIComponent(c)}`);
  };

  const toggleTag = (tag: string) => {
    // 点击标签后立即跳转到列表页
    const params = new URLSearchParams();
    if (city.trim()) params.set('city', city.trim());
    if (checkIn) params.set('checkIn', checkIn.format('YYYY-MM-DD'));
    if (checkOut) params.set('checkOut', checkOut.format('YYYY-MM-DD'));
    // 设置设施筛选参数
    params.set('facilities', tag);
    navigate(`/hotels?${params.toString()}`);
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

      {/* 酒店广告 Banner */}
      {bannerHotels[0] && (
        <div
          className="ctrip-search-banner-wrap"
          onClick={() => navigate(`/hotels/${bannerHotels[0].id}`)}
        >
          <div className="ctrip-search-banner-hotel">
            {/* 左侧酒店图片 */}
            <div className="banner-hotel-image">
              {bannerHotels[0].images?.[0]?.imageUrl ? (
                <img src={bannerHotels[0].images[0].imageUrl} alt={bannerHotels[0].nameCn} />
              ) : (
                <div className="banner-hotel-placeholder" />
              )}
              <div className="banner-hotel-badge">推荐</div>
            </div>
            
            {/* 右侧酒店信息 */}
            <div className="banner-hotel-info">
              <div className="banner-hotel-name">{bannerHotels[0].nameCn}</div>
              <div className="banner-hotel-rating">
                {bannerHotels[0].starRating >= 5 && <span className="rating-stars">💎💎💎💎💎</span>}
                {bannerHotels[0].starRating === 4 && <span className="rating-stars">⭐⭐⭐⭐</span>}
                {bannerHotels[0].starRating === 3 && <span className="rating-stars">⭐⭐⭐</span>}
              </div>
              <div className="banner-hotel-address">
                📍 {bannerHotels[0].address?.slice(0, 20)}
                {bannerHotels[0].address && bannerHotels[0].address.length > 20 ? '...' : ''}
              </div>
              <div className="banner-hotel-price">
                <span className="price-label">特惠价</span>
                <span className="price-value">
                  ¥{bannerHotels[0].roomTypes?.[0]?.price || '--'}
                </span>
                <span className="price-unit">起</span>
              </div>
            </div>
          </div>
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
              <span className="city-text">{city || '选择城市'}</span>
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
                  className={`quick-tag-item ${selectedTags.includes(t) ? 'active' : ''}`}
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
          {POPULAR_CITIES.map((c) => (
            <span key={c} className="ctrip-chip" onClick={() => setCityAndSearch(c)}>
              {c}
            </span>
          ))}
        </div>
      </section>

      {bannerHotels.length > 0 && (
        <section className="ctrip-section">
          <Title level={5} className="ctrip-section-title">推荐酒店</Title>
          <div className="ctrip-banner-scroll">
            {bannerHotels.map((h) => (
              <div key={h.id} className="ctrip-banner-card" onClick={() => navigate(`/hotels/${h.id}`)}>
                <div className="ctrip-banner-cover">
                  {h.images?.[0]?.imageUrl ? (
                    <img src={h.images[0].imageUrl} alt={h.nameCn} />
                  ) : (
                    <div className="ctrip-banner-placeholder" />
                  )}
                </div>
                <div className="ctrip-banner-info">
                  <div className="ctrip-banner-name">{h.nameCn}</div>
                  <div className="ctrip-banner-addr">{h.address}</div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

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
        currentCity={city}
        cities={POPULAR_CITIES}
        onCitySelect={setCity}
        onCancel={() => setShowCityModal(false)}
      />
    </div>
  );
};

export default Search;

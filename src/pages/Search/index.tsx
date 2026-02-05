import React, { useState, useEffect } from 'react';
import { Input, Button, Typography, message, DatePicker, Modal, Segmented } from 'antd';
import { EnvironmentOutlined, CalendarOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { publicHotelApi } from '../../services/api';
import dayjs from 'dayjs';
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

const POPULAR_CITIES = [
  '北京', '上海', '广州', '深圳', '杭州', '成都', '西安', '三亚',
  '南京', '武汉', '厦门', '青岛', '重庆', '苏州', '长沙', '昆明',
];

const Search: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('domestic');
  const [keyword, setKeyword] = useState('');
  const [city, setCity] = useState('上海');
  const [checkIn, setCheckIn] = useState<dayjs.Dayjs | null>(dayjs());
  const [checkOut, setCheckOut] = useState<dayjs.Dayjs | null>(dayjs().add(1, 'day'));
  const [starRating, setStarRating] = useState<number>(0);
  const [priceRange, setPriceRange] = useState<string>('不限');
  const [bannerHotels, setBannerHotels] = useState<any[]>([]);
  const [showDatePicker, setShowDatePicker] = useState<'checkIn' | 'checkOut' | null>(null);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showCityModal, setShowCityModal] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [quickTags, setQuickTags] = useState<string[]>([]);
  const [gpsLoading, setGpsLoading] = useState(false);

  const nights = checkIn && checkOut ? Math.max(1, checkOut.diff(checkIn, 'day')) : 1;

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
          extractQuickTags(res.data || []);
        })
        .catch((e: any) => message.error(e?.message || '加载失败'));
    };
    
    loadRecommendHotels();
  }, [city]); // 依赖城市变化

  // 从酒店列表中提取常见设施作为快捷标签
  const extractQuickTags = (hotels: any[]) => {
    const facilityCount: Record<string, number> = {};
    hotels.forEach((hotel) => {
      hotel.facilities?.forEach((facility: string) => {
        facilityCount[facility] = (facilityCount[facility] || 0) + 1;
      });
    });
    // 按出现频率排序，取前3个
    const sortedTags = Object.entries(facilityCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([tag]) => tag);
    setQuickTags(sortedTags);
  };

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (keyword.trim()) params.set('keyword', keyword.trim());
    if (city.trim()) params.set('city', city.trim());
    if (checkIn) params.set('checkIn', checkIn.format('YYYY-MM-DD'));
    if (checkOut) params.set('checkOut', checkOut.format('YYYY-MM-DD'));
    if (starRating > 0) params.set('starRating', String(starRating));
    if (priceRange !== '不限') params.set('priceRange', priceRange);
    // 将选中的标签作为设施筛选条件传递
    if (selectedTags.length > 0) {
      params.set('facilities', selectedTags.join(','));
    }
    navigate(`/hotels?${params.toString()}`);
  };

  // GPS定位功能
  const handleGpsLocation = () => {
    if (!navigator.geolocation) {
      message.error('您的浏览器不支持定位功能');
      return;
    }
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setGpsLoading(false);
        // 简化处理：根据经纬度模拟城市匹配
        const { longitude } = position.coords;
        // 基于经度简单判断城市（实际应用需要使用地理编码API）
        let detectedCity = '上海';
        if (longitude < 110) detectedCity = '成都';
        else if (longitude < 114) detectedCity = '广州';
        else if (longitude < 117) detectedCity = '深圳';
        else if (longitude < 120) detectedCity = '杭州';
        else if (longitude < 122) detectedCity = '上海';
        else detectedCity = '北京';
        setCity(detectedCity);
        message.success(`已定位到: ${detectedCity}`);
      },
      (error) => {
        setGpsLoading(false);
        if (error.code === 1) {
          message.warning('定位权限被拒绝，请在浏览器设置中允许定位');
        } else {
          message.error('定位失败，请手动选择城市');
        }
      },
      { timeout: 5000 }
    );
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

  const handleCheckInChange = (date: dayjs.Dayjs | null) => {
    setCheckIn(date);
    // 自动调整离店日期
    if (date && (!checkOut || !checkOut.isAfter(date, 'day'))) {
      setCheckOut(date.add(1, 'day'));
    }
    setShowDatePicker(null);
  };

  const handleCheckOutChange = (date: dayjs.Dayjs | null) => {
    setCheckOut(date);
    setShowDatePicker(null);
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
            <div className="date-col" onClick={() => setShowDatePicker('checkIn')}>
              <span className="date-label">入住</span>
              <div className="date-val-row">
                <span className="date-val">{checkIn ? checkIn.format('MM月DD日') : '入住'}</span>
                <span className="date-sub">{checkIn?.isSame(dayjs(), 'day') ? '今天' : checkIn?.isSame(dayjs().add(1, 'day'), 'day') ? '明天' : ''}</span>
                <CalendarOutlined className="date-icon" />
              </div>
            </div>
            <div className="date-nights">
              {nights}晚
            </div>
            <div className="date-col" onClick={() => setShowDatePicker('checkOut')}>
              <span className="date-label">离店</span>
              <div className="date-val-row">
                <span className="date-val">{checkOut ? checkOut.format('MM月DD日') : '离店'}</span>
                <span className="date-sub">{checkOut?.isSame(dayjs().add(1, 'day'), 'day') ? '明天' : ''}</span>
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
      <Modal
        title={showDatePicker === 'checkIn' ? '选择入住日期' : '选择离店日期'}
        open={showDatePicker !== null}
        onCancel={() => setShowDatePicker(null)}
        footer={null}
        centered
        className="ctrip-date-modal"
      >
        <DatePicker
          value={showDatePicker === 'checkIn' ? checkIn : checkOut}
          onChange={showDatePicker === 'checkIn' ? handleCheckInChange : handleCheckOutChange}
          disabledDate={(current) => {
            if (showDatePicker === 'checkIn') {
              return current < dayjs().startOf('day');
            }
            return !!checkIn && current <= checkIn;
          }}
          open
          style={{ width: '100%' }}
          getPopupContainer={(trigger) => trigger.parentElement!}
        />
      </Modal>

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
      <Modal
        title="选择城市"
        open={showCityModal}
        onCancel={() => setShowCityModal(false)}
        footer={null}
        centered
        className="ctrip-city-modal"
      >
        <div className="city-modal-list">
          {POPULAR_CITIES.map((c) => (
            <span
              key={c}
              className={`city-modal-item ${city === c ? 'active' : ''}`}
              onClick={() => {
                setCity(c);
                setShowCityModal(false);
              }}
            >
              {c}
            </span>
          ))}
        </div>
      </Modal>
    </div>
  );
};

export default Search;

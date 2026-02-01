import React, { useState, useEffect } from 'react';
import { Input, Button, Select, Typography, message } from 'antd';
import { SearchOutlined, EnvironmentOutlined, DownOutlined } from '@ant-design/icons';
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
  { value: 0, label: '价格/星级' },
  { value: 5, label: '五星' },
  { value: 4, label: '四星' },
  { value: 3, label: '三星' },
];

const POPULAR_CITIES = [
  '北京', '上海', '广州', '深圳', '杭州', '成都', '西安', '三亚',
  '南京', '武汉', '厦门', '青岛', '重庆', '苏州', '长沙', '昆明',
];

const QUICK_TAGS = ['免费停车场', '上海浦东国际机场', '上海虹桥国际机场', '外滩', '含早餐'];

const Search: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('domestic');
  const [keyword, setKeyword] = useState('');
  const [city, setCity] = useState('上海');
  const [checkIn, setCheckIn] = useState<dayjs.Dayjs | null>(dayjs());
  const [checkOut, setCheckOut] = useState<dayjs.Dayjs | null>(dayjs().add(1, 'day'));
  const [starRating, setStarRating] = useState<number>(0);
  const [bannerHotels, setBannerHotels] = useState<any[]>([]);

  const nights = checkIn && checkOut ? Math.max(0, checkOut.diff(checkIn, 'day')) : 1;

  useEffect(() => {
    publicHotelApi
      .getList({ page: 1, pageSize: 5 })
      .then((res) => setBannerHotels(res.data || []))
      .catch((e: any) => message.error(e?.message || '加载失败'));
  }, []);

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (keyword.trim()) params.set('keyword', keyword.trim());
    if (city.trim()) params.set('city', city.trim());
    if (checkIn) params.set('checkIn', checkIn.format('YYYY-MM-DD'));
    if (checkOut) params.set('checkOut', checkOut.format('YYYY-MM-DD'));
    if (starRating > 0) params.set('starRating', String(starRating));
    navigate(`/hotels?${params.toString()}`);
  };

  const setCityAndSearch = (c: string) => {
    setCity(c);
    navigate(`/hotels?city=${encodeURIComponent(c)}`);
  };

  const minDate = dayjs().startOf('day');

  return (
    <div className="ctrip-search">
      <header className="ctrip-search-header">
        <div className="ctrip-search-brand">
          <span className="ctrip-search-logo">易宿</span>
          <span className="ctrip-search-slogan">酒店·民宿</span>
        </div>
      </header>

      {/* 顶部标题 */}
      <div className="ctrip-search-page-title">酒店查询页</div>

      {/* 促销 Banner */}
      <div className="ctrip-search-banner">
        <div className="ctrip-search-banner-bg" />
        <div className="ctrip-search-banner-content">
          <span className="ctrip-search-banner-text">酒店7折起</span>
          <div className="ctrip-search-banner-tags">
            <span className="ctrip-search-banner-tag">资质说明</span>
            <span className="ctrip-search-banner-tag">精选推荐</span>
          </div>
        </div>
      </div>

      {/* Tab：国内/海外/钟点房/民宿 */}
      <div className="ctrip-search-tabs">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            className={`ctrip-search-tab ${activeTab === tab.key ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 搜索表单 */}
      <div className="ctrip-search-main">
        <div className="ctrip-search-row-first">
          <div className="ctrip-search-city" onClick={() => message.info('可弹窗选择城市')}>
            <span>{city || '选择城市'}</span>
            <DownOutlined className="ctrip-search-arrow" />
          </div>
          <Input
            placeholder="位置/品牌/酒店"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            allowClear
            className="ctrip-search-input-inline"
          />
          <div className="ctrip-search-gps" onClick={() => message.info('定位')}>
            <EnvironmentOutlined />
          </div>
        </div>

        <div className="ctrip-search-row-dates">
          <span className="ctrip-search-date-label">住</span>
          <span className="ctrip-search-date-value">
            {checkIn ? checkIn.format('MM月DD日') : '入住'}
          </span>
          <span className="ctrip-search-date-tag">{checkIn?.isSame(dayjs(), 'day') ? '今天' : ''}</span>
          <span className="ctrip-search-date-dash">-</span>
          <span className="ctrip-search-date-label">离</span>
          <span className="ctrip-search-date-value">
            {checkOut ? checkOut.format('MM月DD日') : '离店'}
          </span>
          <span className="ctrip-search-date-tag">{checkOut?.isSame(dayjs().add(1, 'day'), 'day') ? '明天' : ''}</span>
          <span className="ctrip-search-date-nights">共{nights}晚</span>
        </div>

        <div className="ctrip-search-tip">
          <span className="ctrip-search-tip-icon">🌙</span>
          当前已过0点，如需今天凌晨6点前入住，请选择「今天凌晨」
        </div>

        <div className="ctrip-search-row-price">
          <Select
            value={starRating}
            onChange={setStarRating}
            options={STAR_OPTIONS}
            className="ctrip-search-price-select"
            suffixIcon={<DownOutlined />}
          />
        </div>

        <div className="ctrip-search-quick-tags">
          {QUICK_TAGS.map((t) => (
            <span key={t} className="ctrip-search-quick-tag" onClick={() => message.info(`筛选：${t}`)}>
              {t}
            </span>
          ))}
        </div>

        <Button type="primary" block size="large" className="ctrip-search-btn" onClick={handleSearch}>
          查询
        </Button>
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
    </div>
  );
};

export default Search;

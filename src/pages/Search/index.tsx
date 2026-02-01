import React, { useState, useEffect } from 'react';
import { Input, Button, Typography, message } from 'antd';
import { EnvironmentOutlined } from '@ant-design/icons';
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
  const [checkIn, _setCheckIn] = useState<dayjs.Dayjs | null>(dayjs());
  const [checkOut, _setCheckOut] = useState<dayjs.Dayjs | null>(dayjs().add(1, 'day'));
  const [starRating, _setStarRating] = useState<number>(0);
  const [bannerHotels, setBannerHotels] = useState<any[]>([]);

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



  return (
    <div className="ctrip-search">
      <header className="ctrip-search-header">
        <div className="ctrip-search-page-title">酒店查询页</div>
      </header>

      {/* 促销 Banner */}
      <div className="ctrip-search-banner-wrap">
        <div className="ctrip-search-banner-inner">
          <div className="ctrip-search-banner-text">
            <span className="text-big">酒店7折起</span>
            <span className="text-sub">大促</span>
          </div>
          <div className="ctrip-search-banner-tags">
            <span className="tag-trans">官方补贴</span>
            <span className="tag-trans">资质说明</span>
          </div>
        </div>
      </div>

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

        {/* 搜索表单 */}
        <div className="ctrip-search-form">
          <div className="ctrip-search-row city-row">
            <div className="ctrip-search-city" onClick={() => message.info('可弹窗选择城市')}>
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
            <div className="ctrip-search-gps" onClick={() => message.info('定位')}>
              <span className="gps-text">我的位置</span>
              <EnvironmentOutlined />
            </div>
          </div>

          <div className="ctrip-search-divider" />

          <div className="ctrip-search-row date-row">
            <div className="date-col">
              <span className="date-label">入住</span>
              <div className="date-val-row">
                <span className="date-val">{checkIn ? checkIn.format('MM月DD日') : '入住'}</span>
                <span className="date-sub">{checkIn?.isSame(dayjs(), 'day') ? '今天' : ''}</span>
              </div>
            </div>
            <div className="date-nights">
              1晚
            </div>
            <div className="date-col">
              <span className="date-label">离店</span>
              <div className="date-val-row">
                <span className="date-val">{checkOut ? checkOut.format('MM月DD日') : '离店'}</span>
                <span className="date-sub">{checkOut?.isSame(dayjs().add(1, 'day'), 'day') ? '明天' : ''}</span>
              </div>
            </div>
          </div>

          <div className="ctrip-search-divider" />

          <div className="ctrip-search-row price-row">
            <div className="price-input" onClick={() => message.info('价格星级')}>
              <span className="price-val">价格/星级</span>
              <span className="price-sub">低价/高档</span>
            </div>
            <div className="quick-tags-clean">
              {QUICK_TAGS.slice(0, 2).map((t) => (
                <span key={t} className="quick-tag-item">{t}</span>
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
    </div>
  );
};

export default Search;

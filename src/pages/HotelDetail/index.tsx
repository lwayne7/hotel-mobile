import React, { useEffect, useState } from 'react';
import { Button, Rate, Spin, Carousel } from 'antd';
import {
  LeftOutlined,
  HeartOutlined,
  HeartFilled,
  ShareAltOutlined,
  CalendarOutlined,
  EnvironmentOutlined,
  SoundOutlined,
} from '@ant-design/icons';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { publicHotelApi } from '../../services/api';
import type { Hotel } from '../../services/api';
import dayjs from 'dayjs';
import './index.css';

const ROOM_FILTER_TAGS = ['含早餐', '立即确认', '大床房', '双床房', '免费取', '筛选'];

const HotelDetail: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const [hotel, setHotel] = useState<Hotel | null>(null);
  const [loading, setLoading] = useState(true);
  const [collected, setCollected] = useState(false);
  const [checkIn, setCheckIn] = useState<dayjs.Dayjs | null>(
    searchParams.get('checkIn') ? dayjs(searchParams.get('checkIn')) : dayjs(),
  );
  const [checkOut, setCheckOut] = useState<dayjs.Dayjs | null>(
    searchParams.get('checkOut') ? dayjs(searchParams.get('checkOut')) : dayjs().add(1, 'day'),
  );
  const [roomFilter, setRoomFilter] = useState<string | null>(null);

  const nights = checkIn && checkOut ? Math.max(1, checkOut.diff(checkIn, 'day')) : 1;
  const today = dayjs().startOf('day');
  const checkInLabel = checkIn ? (checkIn.isSame(today, 'day') ? '今天' : checkIn.isSame(today.add(1, 'day'), 'day') ? '明天' : '') : '';
  const checkOutLabel = checkOut ? (checkOut.isSame(today, 'day') ? '今天' : checkOut.isSame(today.add(1, 'day'), 'day') ? '明天' : '') : '';

  useEffect(() => {
    if (!id) return;
    publicHotelApi
      .getById(parseInt(id, 10))
      .then(setHotel)
      .catch(() => setHotel(null))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="ctrip-detail loading-wrap">
        <Spin size="large" />
      </div>
    );
  }

  if (!hotel) {
    return (
      <div className="ctrip-detail">
        <Button type="primary" onClick={() => navigate('/hotels')} className="ctrip-detail-back-btn">
          返回列表
        </Button>
        <div style={{ padding: 24, textAlign: 'center', color: 'var(--ctrip-text-secondary)' }}>
          酒店不存在或未发布
        </div>
      </div>
    );
  }

  const images = hotel.images?.length ? hotel.images : [{ imageUrl: '', description: '暂无图片' }];
  const roomTypes = (hotel.roomTypes || [])
    .slice()
    .sort((a: any, b: any) => Number(a?.price ?? 0) - Number(b?.price ?? 0));
  const minPrice = roomTypes.length
    ? Math.min(...roomTypes.map((r: any) => Number(r?.price)).filter((n: number) => !Number.isNaN(n)))
    : 0;

  const score = 4.8;
  const reviewCount = 4695;
  const reviewQuote = '中式风格装修，舒适安逸';
  const openYear = hotel.openingDate ? dayjs(hotel.openingDate).year() : '2020';
  const features = hotel.facilities?.length ? hotel.facilities : ['免费停车', '一线江景', '新中式风'];
  const transportText = hotel.transportation?.[0] || '距塘桥地铁站步行1.5公里，约22分钟';

  return (
    <div className="ctrip-detail">
      <header className="ctrip-detail-header ctrip-detail-header-overlay">
        <Button type="text" icon={<LeftOutlined />} onClick={() => navigate(-1)} className="ctrip-back-btn" />
        <span className="ctrip-detail-title" title={hotel.nameCn}>
          {hotel.nameCn}
        </span>
        <div className="ctrip-detail-header-actions">
          <span className="ctrip-detail-action" onClick={() => setCollected(!collected)}>
            {collected ? <HeartFilled style={{ color: '#ff4d4f' }} /> : <HeartOutlined />}
          </span>
          <span className="ctrip-detail-action" onClick={() => {}}>
            <ShareAltOutlined />
          </span>
        </div>
      </header>

      <div className="ctrip-detail-gallery">
        <Carousel dots autoplay effect="fade" className="ctrip-detail-carousel">
          {images.map((img: any, index: number) => (
            <div key={img.id ?? index} className="ctrip-detail-slide">
              {img.imageUrl ? (
                <img src={img.imageUrl} alt={img.description || `图片${index + 1}`} />
              ) : (
                <div className="ctrip-detail-slide-placeholder" />
              )}
            </div>
          ))}
        </Carousel>
        <div className="ctrip-detail-gallery-tags">
          <span className="ctrip-detail-gallery-tag">封面</span>
          <span className="ctrip-detail-gallery-tag">精选</span>
          <span className="ctrip-detail-gallery-tag">位置</span>
          <span className="ctrip-detail-gallery-tag ctrip-detail-gallery-tag-link">
            相册 <span className="ctrip-detail-arrow">›</span>
          </span>
        </div>
        <div className="ctrip-detail-gallery-mute">
          <SoundOutlined /> <span className="ctrip-detail-mute-x">×</span>
        </div>
      </div>

      <div className="ctrip-detail-content">
        <div className="ctrip-detail-name-row">
          <div className="ctrip-detail-name">{hotel.nameCn}</div>
          <Rate disabled value={hotel.starRating} className="ctrip-detail-rate" />
        </div>
        <div className="ctrip-detail-badges">
          <span className="ctrip-detail-badge-link">上海美景酒店榜 No.16 ›</span>
          <span className="ctrip-detail-badge-gold">口碑榜 上榜酒店</span>
        </div>

        <div className="ctrip-detail-features-row">
          <span className="ctrip-detail-feature">{openYear}年开业</span>
          {features.slice(0, 4).map((f) => (
            <span key={f} className="ctrip-detail-feature">
              {f}
            </span>
          ))}
          <span className="ctrip-detail-feature-link">设施 ›</span>
          <span className="ctrip-detail-feature-link">政策 ›</span>
        </div>

        <div className="ctrip-detail-score-location">
          <div className="ctrip-detail-score-block">
            <div className="ctrip-detail-score-pill">
              <span className="ctrip-detail-score-num">{score}</span>
              <span className="ctrip-detail-score-label">超棒</span>
              <span className="ctrip-detail-score-reviews">{reviewCount}条 ›</span>
            </div>
            <div className="ctrip-detail-review-quote">"{reviewQuote}"</div>
          </div>
          <div className="ctrip-detail-location-block">
            <div className="ctrip-detail-transport">{transportText}</div>
            <div className="ctrip-detail-addr">{hotel.address}</div>
            <span className="ctrip-detail-map-link">
              <EnvironmentOutlined /> 地图
            </span>
          </div>
        </div>

        <div className="ctrip-detail-dates-row">
          <CalendarOutlined className="ctrip-detail-dates-icon" />
          <span className="ctrip-detail-dates-text">
            {checkIn?.format('M月DD日')} {checkInLabel || ''} {nights}晚 {checkOut?.format('M月DD日')} {checkOutLabel || ''}
          </span>
          <span className="ctrip-detail-dates-arrow">›</span>
        </div>
        <div className="ctrip-detail-dates-tip">
          <span className="ctrip-detail-tip-icon">🌙</span>
          当前已过0点，如需今天凌晨6点前入住，请选择"今天凌晨"
        </div>

        <div className="ctrip-detail-room-filters">
          {ROOM_FILTER_TAGS.map((tag) => (
            <span
              key={tag}
              className={`ctrip-detail-room-filter-tag ${roomFilter === tag ? 'active' : ''}`}
              onClick={() => setRoomFilter(roomFilter === tag ? null : tag)}
            >
              {tag}
            </span>
          ))}
        </div>

        <div className="ctrip-detail-rooms-title">房型与价格</div>
        {roomTypes.length === 0 ? (
          <div className="ctrip-detail-no-room">暂无房型</div>
        ) : (
          <div className="ctrip-detail-rooms">
            {roomTypes.map((room: any, index: number) => (
              <div key={room.id ?? index} className="ctrip-detail-room">
                {room.imageUrl && (
                  <div className="ctrip-detail-room-thumb">
                    <img src={room.imageUrl} alt={room.name} />
                  </div>
                )}
                <div className="ctrip-detail-room-info">
                  <div className="ctrip-detail-room-name">{room.name}</div>
                  <div className="ctrip-detail-room-desc">
                    {[room.bedType, room.roomSize && `${room.roomSize}㎡`, room.maxGuests && `${room.maxGuests}人入住`, room.floors]
                      .filter(Boolean)
                      .join(' ')}
                  </div>
                  <div className="ctrip-detail-room-price-row">
                    <span className="ctrip-price-num">¥{room.price}</span>
                    {room.originalPrice && (
                      <span className="ctrip-detail-room-original">¥{room.originalPrice}</span>
                    )}
                    <span className="ctrip-detail-room-unit">/晚</span>
                  </div>
                </div>
                <span className="ctrip-detail-room-info-icon">ⓘ</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="ctrip-detail-bottom">
        <div className="ctrip-detail-bottom-left">
          <span className="ctrip-detail-ask-icon">💬</span>
          <span>问酒店</span>
        </div>
        <div className="ctrip-detail-bottom-price">
          <span className="ctrip-detail-bottom-label">¥{minPrice}</span>
          <span className="ctrip-detail-bottom-suffix">起</span>
        </div>
        <Button type="primary" size="large" className="ctrip-detail-bottom-btn">
          查看房型
        </Button>
      </div>
    </div>
  );
};

export default HotelDetail;

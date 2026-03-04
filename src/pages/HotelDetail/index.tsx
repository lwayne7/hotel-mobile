import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Button, Rate, Spin, Carousel, message } from 'antd';
import {
  LeftOutlined,
  HeartOutlined,
  HeartFilled,
  ShareAltOutlined,
  SoundOutlined,
} from '@ant-design/icons';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useDateSelection } from '../../hooks';
import { publicHotelApi, Hotel } from '../../services/api';
import DateSelectionModal from '../../components/DateSelectionModal';
import dayjs from 'dayjs';
import './index.css';

const ROOM_FILTER_TAGS = ['含早餐', '立即确认', '大床房', '双床房', '免费取', '筛选'];

const HotelDetail: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  
  // 酒店数据状态
  const [hotel, setHotel] = useState<Hotel | null>(null);
  const [loading, setLoading] = useState(true);
  
  // 使用日期选择 Hook
  const {
    checkIn,
    checkOut,
    nights,
    checkInLabel,
    checkOutLabel,
    handleCheckInChange,
    handleCheckOutChange,
  } = useDateSelection({
    initialCheckIn: searchParams.get('checkIn'),
    initialCheckOut: searchParams.get('checkOut'),
  });
  
  const [collected, setCollected] = useState(false);
  const [showNavHeader, setShowNavHeader] = useState(false);
  const roomsRef = useRef<HTMLDivElement | null>(null);
  const [roomFilter, setRoomFilter] = useState<string | null>(null);
  
  // 日期选择弹窗状态
  const [showDateModal, setShowDateModal] = useState(false);
  const [tempCheckIn, setTempCheckIn] = useState(checkIn);
  const [tempCheckOut, setTempCheckOut] = useState(checkOut);

  // 加载酒店数据
  useEffect(() => {
    if (!id) return;
    
    setLoading(true);
    publicHotelApi
      .getById(Number(id))
      .then((data) => {
        setHotel(data);
        setLoading(false);
      })
      .catch((error) => {
        message.error(error?.message || '加载酒店详情失败');
        setLoading(false);
      });
  }, [id]);

  // 日期选择确认处理
  const handleDateConfirm = () => {
    handleCheckInChange(tempCheckIn);
    handleCheckOutChange(tempCheckOut);
    
    // 更新URL参数
    const params = new URLSearchParams(searchParams.toString());
    params.set('checkIn', tempCheckIn.format('YYYY-MM-DD'));
    params.set('checkOut', tempCheckOut.format('YYYY-MM-DD'));
    navigate(`/hotels/${id}?${params.toString()}`, { replace: true });
    
    setShowDateModal(false);
  };

  // 打开日期选择弹窗
  const handleDateClick = () => {
    setTempCheckIn(checkIn);
    setTempCheckOut(checkOut);
    setShowDateModal(true);
  };

  // Handle scroll to show/hide navigation header
  const handleScroll = useCallback(() => {
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    setShowNavHeader(scrollTop > 200);
  }, []);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  const scrollToRooms = () => {
    roomsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

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
      {/* Scroll-triggered Navigation Header with Hotel Name */}
      <header className={`ctrip-detail-nav-header ${showNavHeader ? 'visible' : ''}`}>
        <Button type="text" icon={<LeftOutlined />} onClick={() => navigate(-1)} className="ctrip-nav-back-btn" />
        <div className="ctrip-nav-title">{hotel.nameCn}</div>
        <div className="ctrip-nav-actions">
          <span className="ctrip-nav-action" onClick={() => setCollected(!collected)}>
            {collected ? <HeartFilled style={{ color: '#ff4d4f' }} /> : <HeartOutlined />}
          </span>
          <span className="ctrip-nav-action">
            <ShareAltOutlined />
          </span>
        </div>
      </header>

      {/* Overlay Header on Image Gallery */}
      <header className="ctrip-detail-header ctrip-detail-header-overlay">
        <Button type="text" icon={<LeftOutlined />} onClick={() => navigate(-1)} className="ctrip-back-btn" />
        <div className="ctrip-detail-header-actions">
          <span className="ctrip-detail-action" onClick={() => setCollected(!collected)}>
            {collected ? <HeartFilled style={{ color: '#ff4d4f' }} /> : <HeartOutlined />}
          </span>
          <span className="ctrip-detail-action" onClick={() => { }}>
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
          <span className="ctrip-detail-badge-link">
            {hotel.address?.match(/^(.+?[市省])/)?.[1] || '精选'}美景酒店榜 No.{(hotel.id % 20) + 1} ›
          </span>
        </div>

        <div className="ctrip-detail-features-row">
          <div className="feature-item">
            <span className="feature-icon">▤</span>
            <span className="feature-text">{openYear}年开业</span>
          </div>
          <div className="feature-item">
            <span className="feature-icon">◈</span>
            <span className="feature-text">新中式风</span>
          </div>
          {features.slice(0, 2).map((f) => (
            <div key={f} className="feature-item">
              <span className="feature-icon">℗</span>
              <span className="feature-text">{f}</span>
            </div>
          ))}
          <span className="ctrip-detail-feature-link">设施政策 ›</span>
        </div>

        <div className="ctrip-detail-score-location">
          <div className="ctrip-detail-score-block">
            <div className="ctrip-detail-score-pill">
              <span className="ctrip-detail-score-num">{score}</span>
              <span className="ctrip-detail-score-label">超棒</span>
            </div>
            <span className="ctrip-detail-score-reviews">{reviewCount}条点评 ›</span>
          </div>
          <div className="ctrip-detail-review-quote">"{reviewQuote}"</div>
          <div className="ctrip-detail-divider-v" />
          <div className="ctrip-detail-location-block">
            <div className="ctrip-detail-addr">{transportText}</div>
            <span className="ctrip-detail-map-link">
              地图
            </span>
          </div>
        </div>
      </div>

      <div className="ctrip-detail-dates-card" onClick={handleDateClick}>
        <div className="dates-row">
          <span className="date-val">{checkIn?.format('MM月DD日')}</span>
          <span className="date-label">{checkInLabel}</span>
          <span className="date-nights">{nights}晚</span>
          <span className="date-val">{checkOut?.format('MM月DD日')}</span>
          <span className="date-label">{checkOutLabel}</span>
          <span className="dates-arrow">›</span>
        </div>
        <div className="dates-tip">
          <span className="tip-badge">🌙</span>
          <span className="tip-text">当前已过0点，如需今天凌晨6点前入住，请选择"今天凌晨"</span>
        </div>
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

      <div id="detail-rooms" className="ctrip-detail-rooms" ref={roomsRef}>
        {roomTypes.length === 0 ? (
          <div className="ctrip-detail-no-room">暂无房型</div>
        ) : (
          <>
            {roomTypes.map((room: any, index: number) => (
              <div key={room.id ?? index} className="ctrip-detail-room">
                <div className="ctrip-detail-room-thumb">
                  {room.imageUrl ? (
                    <img src={room.imageUrl} alt={room.name} />
                  ) : hotel.images?.[0]?.imageUrl ? (
                    <img src={hotel.images[0].imageUrl} alt={room.name} />
                  ) : (
                    <div className="room-thumb-placeholder">🛏️</div>
                  )}
                </div>
                <div className="ctrip-detail-room-info">
                  <div className="ctrip-detail-room-name">{room.name}</div>
                  <div className="ctrip-detail-room-desc">
                    {[room.bedType, room.roomSize && `${room.roomSize}㎡`, room.maxGuests && `${room.maxGuests}人入住`].filter(Boolean).join(' ')}
                  </div>
                  <div className="room-price-row">
                    <div className="price-wrap">
                      <span className="currency">¥</span>
                      <span className="amount">{room.price}</span>
                      <span className="suffix">起</span>
                    </div>
                    <Button type="primary" className="view-room-btn" onClick={scrollToRooms}>查看房型</Button>
                  </div>
                </div>
              </div>
            ))}
          </>
        )}
      </div>

      <div className="ctrip-detail-bottom-spacer" />

      <div className="ctrip-detail-bottom">
        <div className="ctrip-detail-bottom-left">
          <span className="ctrip-detail-ask-icon">💬</span>
          <span>问酒店</span>
        </div>
        <div className="ctrip-detail-bottom-price">
          <span className="ctrip-detail-bottom-label">¥{minPrice}</span>
          <span className="ctrip-detail-bottom-suffix">起</span>
        </div>
        <Button type="primary" size="large" className="ctrip-detail-bottom-btn" onClick={scrollToRooms}>
          查看房型
        </Button>
      </div>

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
    </div>
  );
};

export default HotelDetail;

import React from 'react';
import { useNavigate } from 'react-router-dom';
import type { Hotel } from '../../services/api';
import './index.css';

interface HotelCardProps {
  hotel: Hotel;
  searchParams?: string;
  getMinPrice: (hotel: Hotel) => number;
  getOriginalPrice: (hotel: Hotel) => number;
}

/**
 * 酒店卡片组件
 * 通用的酒店展示卡片，支持普通列表和虚拟列表
 */
const HotelCard: React.FC<HotelCardProps> = ({
  hotel,
  searchParams = '',
  getMinPrice,
  getOriginalPrice,
}) => {
  const navigate = useNavigate();

  // 计算评分和标签
  const minPrice = getMinPrice(hotel);
  const originalPrice = getOriginalPrice(hotel);
  const score = ((hotel.id % 31) / 10 + 4.3).toFixed(1);
  
  // 模拟点评数和收藏数
  const base = (hotel.id * 137) % 8000 + 1000;
  const reviews = base;
  const favorites = Math.floor(base * (1.2 + (hotel.id % 10) * 0.1));
  const favoritesText = favorites >= 10000 
    ? (favorites / 10000).toFixed(1) + '万' 
    : String(favorites);
  
  // 评分标签
  const getRatingLabel = (score: number) => {
    if (score >= 4.8) return '超棒';
    if (score >= 4.5) return '很棒';
    if (score >= 4.0) return '不错';
    return '好评';
  };

  const tags = hotel.facilities?.slice(0, 3) || ['免费WiFi', '免费停车'];
  const nearbyText = hotel.nearbyAttractions?.slice(0, 2).join('·') 
    || hotel.address?.slice(0, 12) 
    || '交通便利';

  const handleClick = () => {
    navigate(`/hotels/${hotel.id}?${searchParams}`);
  };

  return (
    <div className="hotel-card" onClick={handleClick}>
      <div className="hotel-card-cover">
        {hotel.images?.[0]?.imageUrl ? (
          <img src={hotel.images[0].imageUrl} alt={hotel.nameCn} loading="lazy" />
        ) : (
          <div className="hotel-card-placeholder" />
        )}
        <div className="hotel-card-video-icon">
          <span className="video-triangle">▶</span>
        </div>
      </div>
      
      <div className="hotel-card-body">
        <div className="hotel-card-name-row">
          <span className="hotel-card-name">{hotel.nameCn}</span>
          {hotel.starRating >= 5 && (
            <span className="hotel-card-star">💎💎💎💎💎</span>
          )}
        </div>

        <div className="hotel-card-score-row">
          <div className="hotel-score-box">
            <span className="score-num">{score}</span>
            <span className="score-label">{getRatingLabel(Number(score))}</span>
          </div>
          <span className="hotel-score-text">
            {reviews}点评 · {favoritesText}收藏
          </span>
        </div>

        <div className="hotel-card-nearby">{nearbyText}</div>

        <div className="hotel-card-tags">
          {tags.map((tag) => (
            <span key={tag} className="hotel-tag">{tag}</span>
          ))}
        </div>

        <div className="hotel-card-price-row">
          <div className="hotel-price-block">
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
};

export default HotelCard;

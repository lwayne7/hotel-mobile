import React from 'react';
import { Modal } from 'antd';
import './index.css';

interface CitySelectionModalProps {
  open: boolean;
  currentCity: string;
  cities: string[];
  onCitySelect: (city: string) => void;
  onCancel: () => void;
}

/**
 * 城市选择模态框组件
 * 统一的城市选择界面
 */
const CitySelectionModal: React.FC<CitySelectionModalProps> = ({
  open,
  currentCity,
  cities,
  onCitySelect,
  onCancel,
}) => {
  const handleCityClick = (city: string) => {
    onCitySelect(city);
    onCancel();
  };

  return (
    <Modal
      title="选择城市"
      open={open}
      onCancel={onCancel}
      footer={null}
      centered
      className="ctrip-city-modal"
    >
      <div className="city-modal-list">
        {cities.map((city) => (
          <span
            key={city}
            className={`city-modal-item ${currentCity === city ? 'active' : ''}`}
            onClick={() => handleCityClick(city)}
          >
            {city}
          </span>
        ))}
      </div>
    </Modal>
  );
};

export default CitySelectionModal;

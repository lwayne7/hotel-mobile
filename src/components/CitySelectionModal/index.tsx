import React from 'react';
import { Modal } from 'antd';
import './index.css';

interface CitySelectionModalProps {
  open: boolean;
  currentCity: string;
  cities: readonly string[];
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
      width={400}
    >
      <div className="city-selection-grid">
        {cities.map((city) => (
          <div
            key={city}
            className={`city-item ${currentCity === city ? 'active' : ''}`}
            onClick={() => handleCityClick(city)}
          >
            {city}
          </div>
        ))}
      </div>
    </Modal>
  );
};

export default CitySelectionModal;

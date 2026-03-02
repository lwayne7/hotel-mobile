import React from 'react';
import { Modal } from 'antd';
import './index.css';

interface CitySelectionModalProps {
  open: boolean;
  currentCity: string;
  cities: readonly string[] | string[];
  onCitySelect: (city: string) => void;
  onCancel: () => void;
  /** 是否需要确认按钮（默认 false，点击即选中） */
  needConfirm?: boolean;
  /** 确认回调（仅在 needConfirm=true 时使用） */
  onConfirm?: () => void;
}

/**
 * 城市选择模态框组件
 * 统一的城市选择界面
 * 
 * 支持两种模式：
 * 1. 即时模式（needConfirm=false）：点击城市立即选中并关闭
 * 2. 确认模式（needConfirm=true）：点击城市只是临时选中，需要点确定按钮才生效
 */
const CitySelectionModal: React.FC<CitySelectionModalProps> = ({
  open,
  currentCity,
  cities,
  onCitySelect,
  onCancel,
  needConfirm = false,
  onConfirm,
}) => {
  const handleCityClick = (city: string) => {
    if (needConfirm) {
      // 确认模式：通过回调更新外部的临时状态
      onCitySelect(city);
    } else {
      // 即时模式：立即选中并关闭
      onCitySelect(city);
      onCancel();
    }
  };

  const handleConfirm = () => {
    if (needConfirm && onConfirm) {
      onConfirm();
    }
  };

  return (
    <Modal
      title="选择城市"
      open={open}
      onCancel={onCancel}
      footer={needConfirm ? undefined : null}
      onOk={needConfirm ? handleConfirm : undefined}
      okText="确定"
      cancelText="取消"
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

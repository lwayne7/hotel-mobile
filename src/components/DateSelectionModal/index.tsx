import React from 'react';
import { Modal, DatePicker } from 'antd';
import dayjs, { Dayjs } from 'dayjs';

interface DateSelectionModalProps {
  open: boolean;
  checkIn: Dayjs;
  checkOut: Dayjs;
  onCheckInChange: (date: Dayjs) => void;
  onCheckOutChange: (date: Dayjs) => void;
  onCancel: () => void;
  onConfirm: () => void;
}

/**
 * 日期选择模态框组件
 * 统一的入住/离店日期选择界面
 */
const DateSelectionModal: React.FC<DateSelectionModalProps> = ({
  open,
  checkIn,
  checkOut,
  onCheckInChange,
  onCheckOutChange,
  onCancel,
  onConfirm,
}) => {
  const nights = Math.max(1, checkOut.diff(checkIn, 'day'));

  return (
    <Modal
      title="选择入住和离店日期"
      open={open}
      onCancel={onCancel}
      onOk={onConfirm}
      okText="确定"
      cancelText="取消"
      centered
      width={400}
    >
      <div style={{ padding: '12px 0' }}>
        <div style={{ marginBottom: '16px' }}>
          <div style={{ marginBottom: '8px', fontSize: '14px', color: '#666' }}>
            入住日期
          </div>
          <DatePicker
            value={checkIn}
            onChange={(date) => {
              if (date) {
                onCheckInChange(date);
              }
            }}
            disabledDate={(current) => current < dayjs().startOf('day')}
            style={{ width: '100%' }}
            format="YYYY-MM-DD"
          />
        </div>
        <div>
          <div style={{ marginBottom: '8px', fontSize: '14px', color: '#666' }}>
            离店日期
          </div>
          <DatePicker
            value={checkOut}
            onChange={(date) => date && onCheckOutChange(date)}
            disabledDate={(current) => current <= checkIn}
            style={{ width: '100%' }}
            format="YYYY-MM-DD"
          />
        </div>
        <div
          style={{
            marginTop: '12px',
            fontSize: '14px',
            color: '#0086f6',
            textAlign: 'center',
          }}
        >
          共 {nights} 晚
        </div>
      </div>
    </Modal>
  );
};

export default DateSelectionModal;

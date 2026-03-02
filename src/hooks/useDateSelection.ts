import { useState, useCallback } from 'react';
import dayjs, { Dayjs } from 'dayjs';

interface UseDateSelectionOptions {
  initialCheckIn?: string | null;
  initialCheckOut?: string | null;
  defaultNights?: number;
}

/**
 * 日期选择 Hook
 * 封装入住/离店日期的选择逻辑
 */
export const useDateSelection = (options: UseDateSelectionOptions = {}) => {
  const {
    initialCheckIn,
    initialCheckOut,
    defaultNights = 1,
  } = options;

  const [checkIn, setCheckIn] = useState<Dayjs>(
    initialCheckIn ? dayjs(initialCheckIn) : dayjs()
  );
  
  const [checkOut, setCheckOut] = useState<Dayjs>(
    initialCheckOut ? dayjs(initialCheckOut) : dayjs().add(defaultNights, 'day')
  );

  // 计算住宿天数
  const nights = Math.max(1, checkOut.diff(checkIn, 'day'));

  // 获取日期标签（今天/明天）
  const getDateLabel = useCallback((date: Dayjs) => {
    const today = dayjs().startOf('day');
    if (date.isSame(today, 'day')) return '今天';
    if (date.isSame(today.add(1, 'day'), 'day')) return '明天';
    return '';
  }, []);

  const checkInLabel = getDateLabel(checkIn);
  const checkOutLabel = getDateLabel(checkOut);

  // 设置入住日期
  const handleCheckInChange = useCallback((date: Dayjs | null) => {
    if (!date) return;
    
    setCheckIn(date);
    
    // 自动调整离店日期
    if (!checkOut.isAfter(date, 'day')) {
      setCheckOut(date.add(1, 'day'));
    }
  }, [checkOut]);

  // 设置离店日期
  const handleCheckOutChange = useCallback((date: Dayjs | null) => {
    if (!date) return;
    setCheckOut(date);
  }, []);

  // 同时设置入住和离店日期
  const setDates = useCallback((newCheckIn: Dayjs, newCheckOut: Dayjs) => {
    setCheckIn(newCheckIn);
    setCheckOut(newCheckOut);
  }, []);

  return {
    checkIn,
    checkOut,
    nights,
    checkInLabel,
    checkOutLabel,
    handleCheckInChange,
    handleCheckOutChange,
    setDates,
  };
};

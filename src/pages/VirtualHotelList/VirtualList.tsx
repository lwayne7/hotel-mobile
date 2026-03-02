import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Spin } from 'antd';

interface VirtualListProps<T> {
  data: T[];
  itemHeight: number;
  containerHeight: number;
  bufferCount?: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  getItemKey: (item: T, index: number) => string | number;
  onLoadMore?: () => void;
  loadingMore?: boolean;
  hasMore?: boolean;
  loadMoreOffset?: number;
  className?: string;
  showDebug?: boolean; // 是否显示调试信息
}

/**
 * 虚拟列表组件 - 带缓冲机制
 * @param data 数据列表
 * @param itemHeight 每项固定高度
 * @param containerHeight 容器可视高度
 * @param bufferCount 缓冲区项数（上下各缓冲几项）
 * @param renderItem 渲染函数
 * @param getItemKey 获取唯一key
 * @param onLoadMore 加载更多回调
 * @param loadingMore 是否正在加载更多
 * @param hasMore 是否还有更多数据
 * @param loadMoreOffset 触发加载更多的距离阈值
 * @param className 自定义类名
 * @param showDebug 是否显示调试信息（开发环境使用）
 */
function VirtualList<T>({
  data,
  itemHeight,
  containerHeight,
  bufferCount = 3,
  renderItem,
  getItemKey,
  onLoadMore,
  loadingMore = false,
  hasMore = false,
  loadMoreOffset = 100,
  className = '',
  showDebug = false,
}: VirtualListProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const lastScrollTopRef = useRef(0);

  // 计算总高度
  const totalHeight = data.length * itemHeight;

  // 计算可见区域的起始和结束索引
  const visibleCount = Math.ceil(containerHeight / itemHeight);
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - bufferCount);
  const endIndex = Math.min(
    data.length - 1,
    Math.ceil((scrollTop + containerHeight) / itemHeight) + bufferCount
  );

  // 可见项数据
  const visibleData = data.slice(startIndex, endIndex + 1);

  // 偏移量
  const offsetY = startIndex * itemHeight;

  // 滚动事件处理（添加节流优化）
  const handleScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      const target = e.currentTarget;
      const newScrollTop = target.scrollTop;
      setScrollTop(newScrollTop);

      // 触发加载更多
      if (
        onLoadMore &&
        hasMore &&
        !loadingMore &&
        target.scrollHeight - target.scrollTop - target.clientHeight < loadMoreOffset
      ) {
        onLoadMore();
      }
    },
    [onLoadMore, hasMore, loadingMore, loadMoreOffset]
  );

  // 监听窗口大小变化
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        setScrollTop(containerRef.current.scrollTop);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <>
      {/* 调试信息 */}
      {showDebug && (
        <div
          style={{
            position: 'fixed',
            top: '80px',
            right: '10px',
            background: 'rgba(0, 0, 0, 0.85)',
            color: '#fff',
            padding: '10px 12px',
            borderRadius: '6px',
            fontSize: '11px',
            zIndex: 9999,
            fontFamily: 'monospace',
            lineHeight: '1.6',
            boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
          }}
        >
          <div style={{ fontWeight: 'bold', marginBottom: '6px', color: '#4CAF50' }}>
            🔍 虚拟列表
          </div>
          <div>📊 总数: <span style={{ color: '#FFD700' }}>{data.length}</span></div>
          <div>👁️ 渲染: <span style={{ color: '#00BCD4' }}>{visibleData.length}</span></div>
          <div>📍 {startIndex} ~ {endIndex}</div>
          <div>💾 节省: {Math.round((1 - visibleData.length / data.length) * 100)}%</div>
        </div>
      )}

      <div
        ref={containerRef}
        className={`virtual-list-container ${className}`}
        style={{
          height: containerHeight,
          overflow: 'auto',
          position: 'relative',
        }}
        onScroll={handleScroll}
      >
        {/* 占位容器，撑开滚动高度 */}
        <div style={{ height: totalHeight, position: 'relative' }}>
          {/* 可见项容器 */}
          <div
            style={{
              transform: `translateY(${offsetY}px)`,
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
            }}
          >
            {visibleData.map((item, index) => {
              const actualIndex = startIndex + index;
              return (
                <div
                  key={getItemKey(item, actualIndex)}
                  style={{ height: itemHeight }}
                >
                  {renderItem(item, actualIndex)}
                </div>
              );
            })}
          </div>

          {/* 加载更多指示器 - 放在虚拟滚动容器内部 */}
          {loadingMore && (
            <div
              style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                textAlign: 'center',
                padding: '16px',
                color: '#999',
                background: '#fff',
              }}
            >
              <Spin size="small" />
              <span style={{ marginLeft: 8 }}>加载中...</span>
            </div>
          )}

          {/* 没有更多数据提示 - 放在虚拟滚动容器内部 */}
          {!hasMore && data.length > 0 && !loadingMore && (
            <div
              style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                textAlign: 'center',
                padding: '16px',
                color: '#999',
                fontSize: '14px',
                background: '#fff',
              }}
            >
              没有更多了
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default VirtualList;

import React from 'react';

interface VirtualListDebugProps {
  totalItems: number;
  visibleItems: number;
  startIndex: number;
  endIndex: number;
  scrollTop: number;
  show?: boolean;
}

/**
 * 虚拟列表调试信息组件
 * 用于开发时查看虚拟列表的渲染状态
 */
const VirtualListDebug: React.FC<VirtualListDebugProps> = ({
  totalItems,
  visibleItems,
  startIndex,
  endIndex,
  scrollTop,
  show = false,
}) => {
  if (!show) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: '80px',
        right: '10px',
        background: 'rgba(0, 0, 0, 0.8)',
        color: '#fff',
        padding: '12px',
        borderRadius: '8px',
        fontSize: '12px',
        zIndex: 9999,
        fontFamily: 'monospace',
        minWidth: '200px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
      }}
    >
      <div style={{ fontWeight: 'bold', marginBottom: '8px', color: '#4CAF50' }}>
        🔍 虚拟列表调试
      </div>
      <div style={{ lineHeight: '1.6' }}>
        <div>📊 总数据: <span style={{ color: '#FFD700' }}>{totalItems}</span></div>
        <div>👁️ 渲染项: <span style={{ color: '#00BCD4' }}>{visibleItems}</span></div>
        <div>📍 范围: {startIndex} ~ {endIndex}</div>
        <div>📜 滚动: {Math.round(scrollTop)}px</div>
        <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #555' }}>
          <div style={{ color: '#4CAF50' }}>
            ✅ 节省: {totalItems - visibleItems} 个节点
          </div>
          <div style={{ color: '#FF9800' }}>
            💾 内存优化: {Math.round((1 - visibleItems / totalItems) * 100)}%
          </div>
        </div>
      </div>
    </div>
  );
};

export default VirtualListDebug;

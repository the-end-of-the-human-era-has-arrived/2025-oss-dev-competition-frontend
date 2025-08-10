import React, { useState, useRef, useCallback, useEffect } from 'react';
import styles from './MindMap.module.css';

// 더미 그래프 데이터 - 여러 개의 독립적인 그래프
const nodes = [
  // 첫 번째 그래프
  { id: 'a1', x: 150, y: 150, group: 1 },
  { id: 'a2', x: 250, y: 200, group: 1 },
  { id: 'a3', x: 200, y: 300, group: 1 },
  
  // 두 번째 그래프
  { id: 'b1', x: 450, y: 100, group: 2 },
  { id: 'b2', x: 550, y: 150, group: 2 },
  { id: 'b3', x: 500, y: 250, group: 2 },
  { id: 'b4', x: 600, y: 200, group: 2 },
  
  // 세 번째 그래프
  { id: 'c1', x: 100, y: 400, group: 3 },
  { id: 'c2', x: 200, y: 450, group: 3 },
  
  // 네 번째 그래프
  { id: 'd1', x: 500, y: 400, group: 4 },
  { id: 'd2', x: 600, y: 450, group: 4 },
  { id: 'd3', x: 550, y: 500, group: 4 },
];

const edges = [
  // 첫 번째 그래프 연결
  { from: 'a1', to: 'a2' },
  { from: 'a2', to: 'a3' },
  { from: 'a1', to: 'a3' },
  
  // 두 번째 그래프 연결
  { from: 'b1', to: 'b2' },
  { from: 'b2', to: 'b3' },
  { from: 'b3', to: 'b4' },
  { from: 'b1', to: 'b4' },
  
  // 세 번째 그래프 연결
  { from: 'c1', to: 'c2' },
  
  // 네 번째 그래프 연결
  { from: 'd1', to: 'd2' },
  { from: 'd2', to: 'd3' },
  { from: 'd1', to: 'd3' },
];

const MindMap: React.FC = () => {
  const [zoom, setZoom] = useState(0.5); // 초기 줌을 0.5로 설정
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // 줌 제한
  const MIN_ZOOM = 0.3;
  const MAX_ZOOM = 3;

  // 컴포넌트 마운트 시 자동으로 전체 보기
  useEffect(() => {
    const fitToView = () => {
      if (containerRef.current) {
        const container = containerRef.current;
        const containerWidth = container.clientWidth;
        const containerHeight = container.clientHeight;
        
        // 마인드맵의 실제 크기 계산 (노드들의 최대/최소 좌표)
        const minX = Math.min(...nodes.map(n => n.x));
        const maxX = Math.max(...nodes.map(n => n.x));
        const minY = Math.min(...nodes.map(n => n.y));
        const maxY = Math.max(...nodes.map(n => n.y));
        
        const mindmapWidth = maxX - minX + 100; // 여백 포함
        const mindmapHeight = maxY - minY + 100; // 여백 포함
        
        // 컨테이너에 맞는 줌 레벨 계산
        const zoomX = containerWidth / mindmapWidth;
        const zoomY = containerHeight / mindmapHeight;
        const fitZoom = Math.min(zoomX, zoomY, 1); // 1을 넘지 않도록
        
        // 중앙 정렬을 위한 패닝 계산
        const centerX = (containerWidth - mindmapWidth * fitZoom) / 2;
        const centerY = (containerHeight - mindmapHeight * fitZoom) / 2;
        
        setZoom(fitZoom);
        setPan({ x: centerX, y: centerY });
      }
    };

    // 약간의 지연 후 실행 (컨테이너 크기가 안정화된 후)
    const timer = setTimeout(fitToView, 100);
    return () => clearTimeout(timer);
  }, []);

  // 마우스 휠 이벤트 핸들러
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoom * delta));
    
    if (newZoom !== zoom) {
      // 마우스 포인터 위치를 기준으로 줌
      const rect = containerRef.current?.getBoundingClientRect();
      if (rect) {
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        const zoomRatio = newZoom / zoom;
        const newPanX = mouseX - (mouseX - pan.x) * zoomRatio;
        const newPanY = mouseY - (mouseY - pan.y) * zoomRatio;
        
        setZoom(newZoom);
        setPan({ x: newPanX, y: newPanY });
      }
    }
  }, [zoom, pan]);

  // 마우스 드래그 시작
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 0) { // 좌클릭만
      setIsDragging(true);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  }, [pan]);

  // 마우스 드래그 중
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isDragging) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  }, [isDragging, dragStart]);

  // 마우스 드래그 종료
  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // 줌 리셋 (전체 보기)
  const handleDoubleClick = useCallback(() => {
    if (containerRef.current) {
      const container = containerRef.current;
      const containerWidth = container.clientWidth;
      const containerHeight = container.clientHeight;
      
      const minX = Math.min(...nodes.map(n => n.x));
      const maxX = Math.max(...nodes.map(n => n.x));
      const minY = Math.min(...nodes.map(n => n.y));
      const maxY = Math.max(...nodes.map(n => n.y));
      
      const mindmapWidth = maxX - minX + 100;
      const mindmapHeight = maxY - minY + 100;
      
      const zoomX = containerWidth / mindmapWidth;
      const zoomY = containerHeight / mindmapHeight;
      const fitZoom = Math.min(zoomX, zoomY, 1);
      
      const centerX = (containerWidth - mindmapWidth * fitZoom) / 2;
      const centerY = (containerHeight - mindmapHeight * fitZoom) / 2;
      
      setZoom(fitZoom);
      setPan({ x: centerX, y: centerY });
    }
  }, []);

  return (
    <div 
      ref={containerRef}
      className={styles.container}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onDoubleClick={handleDoubleClick}
      style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
    >
      <div 
        className={styles.zoomContainer}
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: '0 0',
        }}
      >
        <svg width="100%" height="100%" className={styles.svg}>
          {edges.map((edge, i) => {
            const from = nodes.find(n => n.id === edge.from)!;
            const to = nodes.find(n => n.id === edge.to)!;
            return (
              <line
                key={i}
                x1={from.x}
                y1={from.y}
                x2={to.x}
                y2={to.y}
                className={styles.edge}
              />
            );
          })}
        </svg>
        {nodes.map(node => (
          <div
            key={node.id}
            className={`${styles.node} ${styles.nodeCircle}`}
            style={{
              left: node.x - 12,
              top: node.y - 12,
            }}
          />
        ))}
      </div>
      
      {/* 줌 컨트롤 */}
      <div className={styles.zoomControls}>
        <button 
          className={styles.zoomButton}
          onClick={() => {
            const newZoom = Math.min(MAX_ZOOM, zoom * 1.2);
            setZoom(newZoom);
          }}
          title="확대"
        >
          +
        </button>
        <button 
          className={styles.zoomButton}
          onClick={() => {
            const newZoom = Math.max(MIN_ZOOM, zoom * 0.8);
            setZoom(newZoom);
          }}
          title="축소"
        >
          −
        </button>
        <button 
          className={styles.zoomButton}
          onClick={handleDoubleClick}
          title="전체 보기"
        >
          ⌂
        </button>
      </div>
    </div>
  );
};

export default MindMap;
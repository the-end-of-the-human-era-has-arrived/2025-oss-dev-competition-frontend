import React, { useState, useRef, useCallback, useEffect } from 'react';
import * as d3 from 'd3-force';
import styles from './MindMap.module.css';

// 노드와 엣지의 타입 정의 (d3-force와 호환되도록 수정)
interface Node extends d3.SimulationNodeDatum {
  id: string;
  x?: number;
  y?: number;
  group: number;
  title?: string;
  fx?: number | null;
  fy?: number | null;
}

interface Edge extends d3.SimulationLinkDatum<Node> {
  source: string | Node;
  target: string | Node;
}

interface MindMapData {
  nodes: Node[];
  edges: Edge[];
}

// API에서 받은 데이터를 MindMap 형태로 변환하는 함수
const convertApiDataToMindMap = (apiData: any): MindMapData => {
  // API 응답 구조에 따라 수정 필요
  // 현재는 예시 구조로 구현
  if (apiData && apiData.nodes && apiData.edges) {
    const nodes = apiData.nodes.map((node: any, index: number) => ({
      id: node.id || `node_${index}`,
      group: node.group || 1,
      title: node.title || node.name || node.id
      // x, y는 d3-force가 자동으로 계산하므로 제거
    }));

    const edges = apiData.edges.map((edge: any) => ({
      source: edge.from || edge.source,
      target: edge.to || edge.target
    }));

    return { nodes, edges };
  }
  
  // 기본값 반환 (빈 마인드맵)
  return { nodes: [], edges: [] };
};

// MindMap API 호출 함수
const fetchMindMapData = async (): Promise<MindMapData> => {
  try {
    // TODO: 실제 API 엔드포인트로 변경 필요
    // const response = await fetch('/api/mindmap');
    // const data = await response.json();
    // return convertApiDataToMindMap(data);
    
    // 임시 더미 데이터 (실제 API 연동 전까지 사용)
    const dummyData = {
      nodes: [
        { id: 'central', group: 1, title: '중심 아이디어' },
        { id: 'concept1', group: 1, title: '하위 개념 1' },
        { id: 'concept2', group: 1, title: '하위 개념 2' },
        { id: 'concept3', group: 1, title: '하위 개념 3' },
        { id: 'related1', group: 2, title: '관련 주제 A' },
        { id: 'related2', group: 2, title: '관련 주제 B' },
        { id: 'detail1', group: 3, title: '세부 사항 1' },
        { id: 'detail2', group: 3, title: '세부 사항 2' },
      ],
      edges: [
        { from: 'central', to: 'concept1' },
        { from: 'central', to: 'concept2' },
        { from: 'central', to: 'concept3' },
        { from: 'concept1', to: 'detail1' },
        { from: 'concept2', to: 'detail2' },
        { from: 'related1', to: 'related2' },
        { from: 'concept3', to: 'related1' },
      ]
    };
    
    return convertApiDataToMindMap(dummyData);
  } catch (error) {
    console.error('MindMap 데이터 로딩 실패:', error);
    return { nodes: [], edges: [] };
  }
};

const MindMap: React.FC = () => {
  const [zoom, setZoom] = useState(1); // 초기 줌을 1로 설정
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [mindMapData, setMindMapData] = useState<MindMapData>({ nodes: [], edges: [] });
  const [loading, setLoading] = useState(true);
  const [draggedNode, setDraggedNode] = useState<Node | null>(null);
  const [simulationSpeed, setSimulationSpeed] = useState(1); // 속도 배율
  const containerRef = useRef<HTMLDivElement>(null);
  const simulationRef = useRef<d3.Simulation<any, any> | null>(null);
  const lastRenderTime = useRef<number>(0);

  // 줌 제한
  const MIN_ZOOM = 0.3;
  const MAX_ZOOM = 3;

  // MindMap 데이터 로딩
  useEffect(() => {
    const loadMindMapData = async () => {
      setLoading(true);
      const data = await fetchMindMapData();
      setMindMapData(data);
      setLoading(false);
    };

    loadMindMapData();
  }, []);

  // d3-force 시뮬레이션 설정
  useEffect(() => {
    if (mindMapData.nodes.length === 0 || !containerRef.current || loading) return;

    console.log('시뮬레이션 시작:', mindMapData.nodes.length, '노드');

    // 이전 시뮬레이션 정지
    if (simulationRef.current) {
      simulationRef.current.stop();
    }

    const container = containerRef.current;
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;

    console.log('컨테이너 크기:', containerWidth, 'x', containerHeight);

    // 노드 데이터 복사 (d3가 수정할 수 있도록)
    const nodes = mindMapData.nodes.map(d => ({
      ...d,
      x: containerWidth / 2 + (Math.random() - 0.5) * 100,
      y: containerHeight / 2 + (Math.random() - 0.5) * 100
    }));

    const links = mindMapData.edges.map(d => ({ ...d }));

    console.log('노드들:', nodes);
    console.log('링크들:', links);

    // 시뮬레이션 생성 - 부드럽고 안정적인 설정
    const simulation = d3.forceSimulation(nodes)
      .force('link', d3.forceLink(links)
        .id((d: any) => d.id)
        .distance(120) // 적당한 거리
        .strength(0.8) // 중간 정도의 링크 힘
        .iterations(2) // 적당한 반복 횟수
      )
      .force('charge', d3.forceManyBody()
        .strength(-800) // 적당한 반발력
        .distanceMin(5) // 최소 거리 설정
        .distanceMax(300) // 넓은 계산 범위
      )
      .force('center', d3.forceCenter(containerWidth / 2, containerHeight / 2)
        .strength(0.05) // 약한 중심 힘으로 자유로운 배치
      )
      .force('collision', d3.forceCollide()
        .radius(35) // 적당한 충돌 반지름
        .strength(0.8) // 부드러운 충돌 처리
      )
      .alpha(1)
      .alphaMin(0.005) // 적당한 최소 알파
      .alphaDecay(0.03 * simulationSpeed) // 적당한 감소율
      .velocityDecay(0.6); // 적당한 마찰력으로 안정적인 움직임

    simulationRef.current = simulation;

    let frameId: number;

    // 틱 이벤트 핸들러 - 부드러운 프레임 제한
    const handleTick = () => {
      // 60fps 제한으로 부드러운 애니메이션
      const now = performance.now();
      if (now - lastRenderTime.current > 16) { // ~60fps
        lastRenderTime.current = now;
        
        frameId = requestAnimationFrame(() => {
          setMindMapData({
            nodes: [...nodes],
            edges: [...links]
          });
        });
      }
    };

    simulation.on('tick', handleTick);

    // 시뮬레이션 완료 시 로그
    simulation.on('end', () => {
      console.log('시뮬레이션 완료');
    });

    // 클린업
    return () => {
      if (frameId) {
        cancelAnimationFrame(frameId);
      }
      simulation.stop();
    };
  }, [mindMapData.nodes.length, loading]);

  // 컨테이너 크기 변경 시 시뮬레이션 중심점 재조정
  useEffect(() => {
    const handleResize = () => {
      if (simulationRef.current && containerRef.current) {
        const containerWidth = containerRef.current.clientWidth;
        const containerHeight = containerRef.current.clientHeight;
        
        simulationRef.current
          .force('center', d3.forceCenter(containerWidth / 2, containerHeight / 2))
          .alpha(0.3)
          .restart();
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
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

  // 노드 드래그 시작
  const handleNodeMouseDown = useCallback((e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation();
    
    if (simulationRef.current) {
      const simulation = simulationRef.current;
      const nodes = simulation.nodes();
      const dragNode = nodes.find((n: any) => n.id === nodeId);
      
      if (dragNode) {
        setDraggedNode(dragNode);
        
        // 드래그 중인 노드 고정
        dragNode.fx = dragNode.x;
        dragNode.fy = dragNode.y;
        
        // 시뮬레이션 재시작
        simulation.alphaTarget(0.3).restart();
      }
    }
  }, []);

  // 노드 드래그 중 - 부드러운 반응
  const handleNodeMouseMove = useCallback((e: React.MouseEvent) => {
    if (draggedNode && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left - pan.x) / zoom;
      const y = (e.clientY - rect.top - pan.y) / zoom;
      
      // 즉시 위치 업데이트 (고정 좌표)
      draggedNode.fx = x;
      draggedNode.fy = y;
      draggedNode.x = x;  // 즉시 반영
      draggedNode.y = y;  // 즉시 반영
      
      // 시뮬레이션을 적당한 에너지로 유지 (흔들림 방지)
      if (simulationRef.current) {
        simulationRef.current.alpha(0.3).restart();
      }
    }
  }, [draggedNode, pan, zoom]);

  // 노드 드래그 종료
  const handleNodeMouseUp = useCallback(() => {
    if (draggedNode && simulationRef.current) {
      // 고정 해제
      draggedNode.fx = null;
      draggedNode.fy = null;
      
      // 시뮬레이션 속도 감소
      simulationRef.current.alphaTarget(0);
    }
    setDraggedNode(null);
  }, [draggedNode]);

  // 속도 조절 함수들 - 부드러운 파라미터
  const increaseSpeed = useCallback(() => {
    const newSpeed = Math.min(simulationSpeed * 1.5, 3); // 적당한 증가폭
    setSimulationSpeed(newSpeed);
    
    if (simulationRef.current) {
      simulationRef.current
        .alphaDecay(0.03 * newSpeed) // 부드러운 변화
        .velocityDecay(Math.max(0.5, 0.6 - newSpeed * 0.1)) // 안정적인 마찰 조정
        .alpha(0.5) // 중간 에너지로 재시작
        .restart();
    }
  }, [simulationSpeed]);

  const decreaseSpeed = useCallback(() => {
    const newSpeed = Math.max(simulationSpeed / 1.5, 0.3); // 적당한 감소폭
    setSimulationSpeed(newSpeed);
    
    if (simulationRef.current) {
      simulationRef.current
        .alphaDecay(0.03 * newSpeed)
        .velocityDecay(Math.min(0.8, 0.6 + (1 - newSpeed) * 0.2)) // 부드러운 마찰 증가
        .alpha(0.5)
        .restart();
    }
  }, [simulationSpeed]);

  const resetSpeed = useCallback(() => {
    setSimulationSpeed(1);
    
    if (simulationRef.current) {
      simulationRef.current
        .alphaDecay(0.03)
        .velocityDecay(0.6)
        .alpha(0.5)
        .restart();
    }
  }, []);

  // 시뮬레이션 일시정지/재개
  const toggleSimulation = useCallback(() => {
    if (simulationRef.current) {
      const currentAlpha = simulationRef.current.alpha();
      if (currentAlpha > 0.01) {
        // 현재 실행 중이면 정지
        simulationRef.current.alpha(0);
      } else {
        // 정지 상태면 재시작
        simulationRef.current.alpha(0.3).restart();
      }
    }
  }, []);

  // 줌 리셋 (전체 보기)
  const handleDoubleClick = useCallback(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    
    if (simulationRef.current && containerRef.current) {
      const containerWidth = containerRef.current.clientWidth;
      const containerHeight = containerRef.current.clientHeight;
      
      simulationRef.current
        .force('center', d3.forceCenter(containerWidth / 2, containerHeight / 2))
        .alpha(0.3)
        .restart();
    }
  }, []);

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          마인드맵을 불러오는 중...
        </div>
      </div>
    );
  }

  if (mindMapData.nodes.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.empty}>
          표시할 마인드맵 데이터가 없습니다.
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className={styles.container}
      onWheel={handleWheel}
      onMouseDown={draggedNode ? undefined : handleMouseDown}
      onMouseMove={draggedNode ? handleNodeMouseMove : handleMouseMove}
      onMouseUp={draggedNode ? handleNodeMouseUp : handleMouseUp}
      onMouseLeave={draggedNode ? handleNodeMouseUp : handleMouseUp}
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
          {/* 에지 렌더링 */}
          {mindMapData.edges.map((edge, i) => {
            // d3-force가 처리한 후 edge.source와 edge.target이 노드 객체가 됨
            let sourceNode, targetNode;

            if (typeof edge.source === 'string') {
              sourceNode = mindMapData.nodes.find(n => n.id === edge.source);
            } else {
              sourceNode = edge.source;
            }

            if (typeof edge.target === 'string') {
              targetNode = mindMapData.nodes.find(n => n.id === edge.target);
            } else {
              targetNode = edge.target;
            }

            // 좌표가 없으면 렌더링하지 않음
            if (!sourceNode || !targetNode || 
                sourceNode.x === undefined || sourceNode.y === undefined ||
                targetNode.x === undefined || targetNode.y === undefined) {
              return null;
            }

            return (
              <line
                key={`edge-${i}`}
                x1={sourceNode.x}
                y1={sourceNode.y}
                x2={targetNode.x}
                y2={targetNode.y}
                stroke="#e1e5e9"
                strokeWidth="2"
              />
            );
          })}

          {/* 노드 렌더링 - SVG로 변경 */}
          {mindMapData.nodes.map(node => {
            if (node.x === undefined || node.y === undefined) return null;
            
            return (
              <g key={`node-${node.id}`}>
                {/* 노드 원 */}
                <circle
                  cx={node.x}
                  cy={node.y}
                  r="12"
                  fill="#2e75cc"
                  stroke="#ffffff"
                  strokeWidth="2"
                  style={{ cursor: 'grab' }}
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    handleNodeMouseDown(e as any, node.id);
                  }}
                >
                  <title>{node.title || node.id}</title>
                </circle>
                
                {/* 노드 라벨 */}
                {node.title && (
                  <text
                    x={node.x}
                    y={node.y + 25}
                    textAnchor="middle"
                    fontSize="12"
                    fontWeight="500"
                    fill="#37352f"
                    style={{ pointerEvents: 'none' }}
                  >
                    {node.title}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
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

      {/* 시뮬레이션 컨트롤 */}
      <div className={styles.simulationControls}>
        <button 
          className={styles.controlButton}
          onClick={increaseSpeed}
          title="속도 증가"
        >
          ⏩
        </button>
        <button 
          className={styles.controlButton}
          onClick={decreaseSpeed}
          title="속도 감소"
        >
          ⏪
        </button>
        <button 
          className={styles.controlButton}
          onClick={resetSpeed}
          title="속도 리셋"
        >
          ⏺
        </button>
        <button 
          className={styles.controlButton}
          onClick={toggleSimulation}
          title="일시정지/재개"
        >
          ⏯
        </button>
        <div className={styles.speedDisplay}>
          {simulationSpeed.toFixed(1)}x
        </div>
      </div>
    </div>
  );
};

export default MindMap;
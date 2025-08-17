import React, { useState, useRef, useCallback, useEffect } from "react";
import * as d3 from "d3-force";
import styles from "./MindMap.module.css";
import { useAuthStore } from "../../stores/authStore";

// API 설정
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:8080";

// 노드와 엣지의 타입 정의 (d3-force와 호환되도록 수정)
interface Node extends d3.SimulationNodeDatum {
  id: string;
  x?: number;
  y?: number;
  notionPageId: string;
  keyword?: string;
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
  if (apiData && apiData.nodes && apiData.edges) {
    const nodes = apiData.nodes.map((node: any) => ({
      id: node.id,
      notionPageId: node.notion_page_id,
      keyword: node.keyword,
      // x, y는 d3-force가 자동으로 계산하므로 제거
    }));

    const edges = apiData.edges.map((edge: any) => ({
      source: edge.keyword1,
      target: edge.keyword2,
    }));

    return { nodes, edges };
  }

  // 기본값 반환 (빈 마인드맵)
  return { nodes: [], edges: [] };
};

// MindMap API 호출 함수
const fetchMindMapData = async (userId?: string): Promise<MindMapData> => {
  try {
    if (!userId) {
      console.warn("사용자 ID가 없습니다. 더미 데이터를 사용합니다.");
      return getDummyData();
    }

    // 실제 API 호출
    const response = await fetch(`${API_BASE_URL}/api/users/${userId}/mindmap`, {
      method: "GET",
      credentials: "include", // 쿠키 포함
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`API 호출 실패: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return convertApiDataToMindMap(data);
  } catch (error) {
    console.error("MindMap 데이터 로딩 실패:", error);
    console.log("더미 데이터를 사용합니다.");
    return getDummyData();
  }
};

// 더미 데이터 생성 함수 (API 연동 실패 시 폴백용)
const getDummyData = (): MindMapData => {
  const dummyApiData = {
    nodes: [
      { id: "central", notion_page_id: "page_001", keyword: "중심 아이디어" },
      { id: "concept1", notion_page_id: "page_002", keyword: "하위 개념 1" },
      { id: "concept2", notion_page_id: "page_003", keyword: "하위 개념 2" },
      { id: "concept3", notion_page_id: "page_004", keyword: "하위 개념 3" },
      { id: "related1", notion_page_id: "page_005", keyword: "관련 주제 A" },
      { id: "related2", notion_page_id: "page_006", keyword: "관련 주제 B" },
      { id: "detail1", notion_page_id: "page_007", keyword: "세부 사항 1" },
      { id: "detail2", notion_page_id: "page_008", keyword: "세부 사항 2" },
    ],
    edges: [
      { keyword1: "central", keyword2: "concept1" },
      { keyword1: "central", keyword2: "concept2" },
      { keyword1: "central", keyword2: "concept3" },
      { keyword1: "concept1", keyword2: "detail1" },
      { keyword1: "concept2", keyword2: "detail2" },
      { keyword1: "related1", keyword2: "related2" },
      { keyword1: "concept3", keyword2: "related1" },
    ],
  };

  return convertApiDataToMindMap(dummyApiData);
};

const MindMap: React.FC = () => {
  const { user } = useAuthStore();
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [mindMapData, setMindMapData] = useState<MindMapData>({ nodes: [], edges: [] });
  const [loading, setLoading] = useState(true);
  const [draggedNode, setDraggedNode] = useState<Node | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const simulationRef = useRef<d3.Simulation<any, any> | null>(null);
  const lastRenderTime = useRef<number>(0);

  // 줌 제한
  const MIN_ZOOM = 0.3;
  const MAX_ZOOM = 3;

  // 그래프를 화면에 맞게 조정하고 정중앙에 위치시키는 함수
  const fitGraphToView = useCallback(
    (nodes?: Node[]) => {
      // 항상 실제 컨테이너 크기를 측정해서 사용
      const currentContainer = containerRef.current;
      if (!currentContainer) return;

      const actualWidth = currentContainer.clientWidth;
      const actualHeight = currentContainer.clientHeight;

      // 노드 데이터 가져오기 (시뮬레이션에서 최신 데이터 참조)
      const currentNodes = simulationRef.current?.nodes() || [];
      const targetNodes =
        nodes || currentNodes.filter((n: any) => n.x !== undefined && n.y !== undefined);

      if (targetNodes.length === 0) {
        setZoom(1);
        setPan({ x: actualWidth / 2, y: actualHeight / 2 });
        return;
      }

      // 노드들의 범위 계산 (넉넉한 패딩으로 잘림 방지)
      const minX = Math.min(...targetNodes.map((n: any) => n.x!));
      const maxX = Math.max(...targetNodes.map((n: any) => n.x!));
      const minY = Math.min(...targetNodes.map((n: any) => n.y!));
      const maxY = Math.max(...targetNodes.map((n: any) => n.y!));

      // 그래프의 실제 중심점 계산
      const graphCenterX = (minX + maxX) / 2;
      const graphCenterY = (minY + maxY) / 2;

      // 넉넉한 패딩으로 그래프가 잘리지 않도록 보장
      const padding = 100;
      const graphWidth = maxX - minX + padding * 2;
      const graphHeight = maxY - minY + padding * 2;

      // 실제 컨테이너 크기 기준으로 줌 레벨 계산 (85%로 여유 공간 확보)
      const scaleX = (actualWidth * 0.85) / graphWidth;
      const scaleY = (actualHeight * 0.85) / graphHeight;
      const optimalZoom = Math.min(scaleX, scaleY, MAX_ZOOM);
      const finalZoom = Math.max(optimalZoom, MIN_ZOOM);

      // 실제 컨테이너의 중심점
      const containerCenterX = actualWidth / 2;
      const containerCenterY = actualHeight / 2;

      // 그래프의 정중앙이 컨테이너의 정중앙에 오도록 pan 계산
      // transform: translate(panX, panY) scale(zoom) 적용 시
      // 그래프 중심이 컨테이너 중심에 위치하려면:
      // panX + graphCenterX * zoom = containerCenterX
      const panX = containerCenterX - graphCenterX * finalZoom;
      const panY = containerCenterY - graphCenterY * finalZoom;

      setZoom(finalZoom);
      setPan({ x: panX, y: panY });
    },
    [MIN_ZOOM, MAX_ZOOM]
  );

  // MindMap 데이터 로딩
  useEffect(() => {
    const loadMindMapData = async () => {
      setLoading(true);
      const data = await fetchMindMapData(user?.id);
      setMindMapData(data);
      setLoading(false);
    };

    loadMindMapData();
  }, [user?.id]);

  // d3-force 시뮬레이션 설정
  useEffect(() => {
    if (mindMapData.nodes.length === 0 || !containerRef.current || loading) return;

    // 이전 시뮬레이션 정지
    if (simulationRef.current) {
      simulationRef.current.stop();
    }

    // 노드 데이터 복사 (원점 중심에서 시작)
    const centerX = 0;
    const centerY = 0;
    const nodes = mindMapData.nodes.map((d) => ({
      ...d,
      x: centerX + (Math.random() - 0.5) * 100,
      y: centerY + (Math.random() - 0.5) * 100,
    }));

    const links = mindMapData.edges.map((d) => ({ ...d }));

    // 시뮬레이션 생성 - 빠르게 수렴하도록 설정
    const simulation = d3
      .forceSimulation(nodes)
      .force(
        "link",
        d3
          .forceLink(links)
          .id((d: any) => d.id)
          .distance(120)
          .strength(0.8)
          .iterations(2)
      )
      .force("charge", d3.forceManyBody().strength(-800).distanceMin(5).distanceMax(300))
      .force("center", d3.forceCenter(0, 0).strength(0.05))
      .force("collision", d3.forceCollide().radius(35).strength(0.8))
      .alpha(1)
      .alphaMin(0.005)
      .alphaDecay(0.03)
      .velocityDecay(0.6);

    simulationRef.current = simulation;

    let frameId: number;

    // 틱 이벤트 핸들러 - 부드러운 프레임 제한
    const handleTick = () => {
      // 60fps 제한으로 부드러운 애니메이션
      const now = performance.now();
      if (now - lastRenderTime.current > 16) {
        // ~60fps
        lastRenderTime.current = now;

        frameId = requestAnimationFrame(() => {
          setMindMapData({
            nodes: [...nodes],
            edges: [...links],
          });
        });
      }
    };

    simulation.on("tick", handleTick);

    setTimeout(() => {
      fitGraphToView();
    }, 500);

    // 클린업
    return () => {
      if (frameId) {
        cancelAnimationFrame(frameId);
      }
      simulation.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mindMapData.nodes.length, mindMapData.edges.length, loading, fitGraphToView]);

  // 컨테이너 크기 변경 시 중심점 재조정
  // ResizeObserver로 컨테이너 크기 감지
  useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver(() => {
      // 시뮬레이션 중심점 업데이트 (원점 유지)
      if (simulationRef.current) {
        simulationRef.current.force("center", d3.forceCenter(0, 0)).alpha(0.3).restart();
      }

      // 컨테이너 크기 변경 시 그래프 다시 중앙 정렬
      setTimeout(() => {
        fitGraphToView();
      }, 300);
    });

    resizeObserver.observe(containerRef.current);

    // 초기 크기 설정
    const initialWidth = containerRef.current.clientWidth;
    const initialHeight = containerRef.current.clientHeight;

    // 초기 pan을 컨테이너 중앙으로 설정
    setPan({ x: initialWidth / 2, y: initialHeight / 2 });

    return () => {
      resizeObserver.disconnect();
    };
  }, [fitGraphToView]);

  // 마우스 휠 이벤트 핸들러 (그래프 중앙 기준 줌)
  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
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
    },
    [zoom, pan]
  );

  // 마우스 드래그 시작
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.button === 0) {
        // 좌클릭만
        setIsDragging(true);
        setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
      }
    },
    [pan]
  );

  // 마우스 드래그 중
  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (isDragging) {
        setPan({
          x: e.clientX - dragStart.x,
          y: e.clientY - dragStart.y,
        });
      }
    },
    [isDragging, dragStart]
  );

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

        // 시뮬레이션 가볍게 재시작
        simulation.alphaTarget(0.1).restart();
      }
    }
  }, []);

  // 노드 드래그 중 - 부드러운 반응
  const handleNodeMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (draggedNode && containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const x = (e.clientX - rect.left - pan.x) / zoom;
        const y = (e.clientY - rect.top - pan.y) / zoom;

        // 즉시 위치 업데이트 (고정 좌표)
        draggedNode.fx = x;
        draggedNode.fy = y;
        draggedNode.x = x; // 즉시 반영
        draggedNode.y = y; // 즉시 반영

        // 시뮬레이션을 낮은 에너지로 유지 (흔들림 방지)
        if (simulationRef.current) {
          simulationRef.current.alpha(0.1).restart();
        }
      }
    },
    [draggedNode, pan, zoom]
  );

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

  // 줌 리셋 (전체 보기)
  const handleDoubleClick = useCallback(() => {
    fitGraphToView();

    if (simulationRef.current) {
      simulationRef.current.force("center", d3.forceCenter(0, 0)).alpha(0.3).restart();
    }
  }, [fitGraphToView]);

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>마인드맵을 불러오는 중...</div>
      </div>
    );
  }

  if (mindMapData.nodes.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.empty}>표시할 마인드맵 데이터가 없습니다.</div>
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
      style={{ cursor: isDragging ? "grabbing" : "grab" }}
    >
      <div
        className={styles.zoomContainer}
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: "0 0",
        }}
      >
        <svg width="100%" height="100%" className={styles.svg} style={{ overflow: "visible" }}>
          {/* 에지 렌더링 */}
          {mindMapData.edges.map((edge, i) => {
            // d3-force가 처리한 후 edge.source와 edge.target이 노드 객체가 됨
            let sourceNode, targetNode;

            if (typeof edge.source === "string") {
              sourceNode = mindMapData.nodes.find((n) => n.id === edge.source);
            } else {
              sourceNode = edge.source;
            }

            if (typeof edge.target === "string") {
              targetNode = mindMapData.nodes.find((n) => n.id === edge.target);
            } else {
              targetNode = edge.target;
            }

            // 좌표가 없으면 렌더링하지 않음
            if (
              !sourceNode ||
              !targetNode ||
              sourceNode.x === undefined ||
              sourceNode.y === undefined ||
              targetNode.x === undefined ||
              targetNode.y === undefined
            ) {
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

          {/* 노드 렌더링 */}
          {mindMapData.nodes.map((node) => {
            if (node.x === undefined || node.y === undefined) {
              return null;
            }

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
                  style={{ cursor: "grab" }}
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    handleNodeMouseDown(e as any, node.id);
                  }}
                >
                  <title>{node.keyword || node.id}</title>
                </circle>

                {/* 노드 라벨 */}
                {node.keyword && (
                  <text
                    x={node.x}
                    y={node.y + 25}
                    textAnchor="middle"
                    fontSize="12"
                    fontWeight="500"
                    fill="#37352f"
                    style={{ pointerEvents: "none" }}
                  >
                    {node.keyword}
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
        <button className={styles.zoomButton} onClick={handleDoubleClick} title="전체 보기">
          ⌂
        </button>
      </div>
    </div>
  );
};

export default MindMap;

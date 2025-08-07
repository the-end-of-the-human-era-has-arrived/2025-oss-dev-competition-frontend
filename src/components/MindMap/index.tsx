import React from 'react';
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
  return (
    <div className={styles.container}>
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
  );
};

export default MindMap;
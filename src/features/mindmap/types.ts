export interface MindMapNode {
  id: string;
  x: number;
  y: number;
  group: number;
  label: string;
  level: number;
  parentId?: string;
  children?: string[];
  metadata?: {
    color?: string;
    size?: number;
    icon?: string;
    description?: string;
  };
}

export interface MindMapEdge {
  id: string;
  from: string;
  to: string;
  type?: 'solid' | 'dashed' | 'dotted';
  color?: string;
  width?: number;
}

export interface MindMapData {
  id: string;
  title: string;
  nodes: MindMapNode[];
  edges: MindMapEdge[];
  createdAt: Date;
  updatedAt: Date;
  version: number;
}

export interface MindMapState {
  currentMap: MindMapData | null;
  maps: MindMapData[];
  loading: boolean;
  error: string | null;
  selectedNode: string | null;
  zoom: number;
  center: { x: number; y: number };
}

export interface CreateMindMapRequest {
  title: string;
  initialData?: {
    nodes?: MindMapNode[];
    edges?: MindMapEdge[];
  };
}

export interface UpdateMindMapRequest {
  id: string;
  title?: string;
  nodes?: MindMapNode[];
  edges?: MindMapEdge[];
}

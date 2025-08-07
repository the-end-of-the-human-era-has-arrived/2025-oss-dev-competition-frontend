// 공통 타입 정의
export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  provider?: 'google' | 'github' | 'kakao' | 'naver';
}

export interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: Date;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
}

export interface MindMapNode {
  id: string;
  x: number;
  y: number;
  group: number;
  label?: string;
}

export interface MindMapEdge {
  from: string;
  to: string;
}

export interface AuthState {
  isLoggedIn: boolean;
  user: User | null;
  loading: boolean;
  error: string | null;
} 
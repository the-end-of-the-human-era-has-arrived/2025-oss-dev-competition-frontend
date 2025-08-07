export interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: Date;
  metadata?: {
    type?: 'text' | 'image' | 'file';
    url?: string;
    fileName?: string;
  };
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
  isActive?: boolean;
}

export interface ChatState {
  messages: Message[];
  currentSession: ChatSession | null;
  sessions: ChatSession[];
  loading: boolean;
  error: string | null;
}

export interface SendMessageRequest {
  message: string;
  sessionId?: string;
  context?: {
    mindMapData?: any;
    previousMessages?: Message[];
  };
}

export interface SendMessageResponse {
  message: Message;
  sessionId: string;
  suggestions?: string[];
}

import { API_BASE_URL } from '../utils/constants';
import { User, Message, ChatSession } from '../types';

// 기본 API 클라이언트
class ApiClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // GET 요청
  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  // POST 요청
  async post<T>(endpoint: string, data: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // PUT 요청
  async put<T>(endpoint: string, data: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // DELETE 요청
  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

// API 클라이언트 인스턴스
export const apiClient = new ApiClient(API_BASE_URL);

// 인증 관련 API
export const authAPI = {
  // 소셜 로그인
  socialLogin: async (provider: string, token: string): Promise<User> => {
    return apiClient.post<User>('/auth/social-login', { provider, token });
  },

  // 로그아웃
  logout: async (): Promise<void> => {
    return apiClient.post<void>('/auth/logout', {});
  },

  // 사용자 정보 조회
  getCurrentUser: async (): Promise<User> => {
    return apiClient.get<User>('/auth/me');
  },
};

// 채팅 관련 API
export const chatAPI = {
  // 채팅 세션 목록 조회
  getSessions: async (): Promise<ChatSession[]> => {
    return apiClient.get<ChatSession[]>('/chat/sessions');
  },

  // 채팅 세션 생성
  createSession: async (title: string): Promise<ChatSession> => {
    return apiClient.post<ChatSession>('/chat/sessions', { title });
  },

  // 메시지 전송
  sendMessage: async (sessionId: string, message: string): Promise<Message> => {
    return apiClient.post<Message>(`/chat/sessions/${sessionId}/messages`, {
      text: message,
    });
  },

  // 채팅 세션 삭제
  deleteSession: async (sessionId: string): Promise<void> => {
    return apiClient.delete<void>(`/chat/sessions/${sessionId}`);
  },
};

// 마인드맵 관련 API
export const mindmapAPI = {
  // 마인드맵 데이터 조회
  getMindMap: async (): Promise<{ nodes: any[]; edges: any[] }> => {
    return apiClient.get<{ nodes: any[]; edges: any[] }>('/mindmap');
  },

  // 마인드맵 업데이트
  updateMindMap: async (data: { nodes: any[]; edges: any[] }): Promise<void> => {
    return apiClient.put<void>('/mindmap', data);
  },
}; 
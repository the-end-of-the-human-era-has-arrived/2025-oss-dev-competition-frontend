import { Message, ChatSession, SendMessageRequest, SendMessageResponse } from '../types';
import authService from '../../auth/services/authService';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001/api';

export class ChatService {
  private static instance: ChatService;

  static getInstance(): ChatService {
    if (!ChatService.instance) {
      ChatService.instance = new ChatService();
    }
    return ChatService.instance;
  }

  private async getAuthHeaders(): Promise<HeadersInit> {
    const token = authService.getToken();
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
    };
  }

  async sendMessage(request: SendMessageRequest): Promise<SendMessageResponse> {
    try {
      const headers = await this.getAuthHeaders();
      
      const response = await fetch(`${API_BASE_URL}/chat/send`, {
        method: 'POST',
        headers,
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      return await response.json();
    } catch (error) {
      console.error('Send message error:', error);
      throw error;
    }
  }

  async getSessions(): Promise<ChatSession[]> {
    try {
      const headers = await this.getAuthHeaders();
      
      const response = await fetch(`${API_BASE_URL}/chat/sessions`, {
        headers,
      });

      if (!response.ok) {
        throw new Error('Failed to fetch sessions');
      }

      return await response.json();
    } catch (error) {
      console.error('Get sessions error:', error);
      throw error;
    }
  }

  async getSession(sessionId: string): Promise<ChatSession> {
    try {
      const headers = await this.getAuthHeaders();
      
      const response = await fetch(`${API_BASE_URL}/chat/sessions/${sessionId}`, {
        headers,
      });

      if (!response.ok) {
        throw new Error('Failed to fetch session');
      }

      return await response.json();
    } catch (error) {
      console.error('Get session error:', error);
      throw error;
    }
  }

  async createSession(title?: string): Promise<ChatSession> {
    try {
      const headers = await this.getAuthHeaders();
      
      const response = await fetch(`${API_BASE_URL}/chat/sessions`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ title: title || 'New Chat' }),
      });

      if (!response.ok) {
        throw new Error('Failed to create session');
      }

      return await response.json();
    } catch (error) {
      console.error('Create session error:', error);
      throw error;
    }
  }

  async deleteSession(sessionId: string): Promise<void> {
    try {
      const headers = await this.getAuthHeaders();
      
      const response = await fetch(`${API_BASE_URL}/chat/sessions/${sessionId}`, {
        method: 'DELETE',
        headers,
      });

      if (!response.ok) {
        throw new Error('Failed to delete session');
      }
    } catch (error) {
      console.error('Delete session error:', error);
      throw error;
    }
  }
}

export default ChatService.getInstance();

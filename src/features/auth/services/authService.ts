import { User, NotionLoginResponse } from '../types';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001/api';

export class AuthService {
  private static instance: AuthService;
  private token: string | null = null;

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  setToken(token: string): void {
    this.token = token;
    localStorage.setItem('auth_token', token);
  }

  getToken(): string | null {
    if (!this.token) {
      this.token = localStorage.getItem('auth_token');
    }
    return this.token;
  }

  clearToken(): void {
    this.token = null;
    localStorage.removeItem('auth_token');
  }

  async loginWithNotion(code: string): Promise<User> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/notion/callback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code }),
      });

      if (!response.ok) {
        throw new Error('Notion login failed');
      }

      const data: NotionLoginResponse = await response.json();
      
      const user: User = {
        id: data.workspace_owner.user.id,
        name: data.workspace_owner.user.name,
        email: data.workspace_owner.user.person.email,
        avatar: data.workspace_owner.user.avatar_url,
        provider: 'notion',
      };

      this.setToken(data.access_token);
      return user;
    } catch (error) {
      console.error('Notion login error:', error);
      throw error;
    }
  }

  async logout(): Promise<void> {
    try {
      const token = this.getToken();
      if (token) {
        await fetch(`${API_BASE_URL}/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      this.clearToken();
    }
  }

  async getCurrentUser(): Promise<User | null> {
    try {
      const token = this.getToken();
      if (!token) return null;

      const response = await fetch(`${API_BASE_URL}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        this.clearToken();
        return null;
      }

      return await response.json();
    } catch (error) {
      console.error('Get current user error:', error);
      this.clearToken();
      return null;
    }
  }
}

export default AuthService.getInstance();

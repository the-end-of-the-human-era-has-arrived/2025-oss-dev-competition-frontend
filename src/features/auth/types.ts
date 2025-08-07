export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  provider?: 'notion' | 'google' | 'github' | 'kakao' | 'naver';
}

export interface AuthState {
  isLoggedIn: boolean;
  user: User | null;
  loading: boolean;
  error: string | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface NotionLoginResponse {
  access_token: string;
  token_type: string;
  workspace_id: string;
  workspace_name: string;
  workspace_icon?: string;
  workspace_owner: {
    type: string;
    user: {
      object: string;
      id: string;
      name: string;
      avatar_url?: string;
      type: string;
      person: {
        email: string;
      };
    };
  };
}

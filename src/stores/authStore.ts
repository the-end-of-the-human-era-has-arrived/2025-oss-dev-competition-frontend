import { create } from 'zustand';

interface AuthState {
  isLoggedIn: boolean;
  user: {
    name: string;
    id?: string;
  } | null;
  login: () => Promise<void>;
  logout: () => void;
  setUser: (user: { name: string; id?: string }) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  isLoggedIn: false,
  user: null,
  
  login: async () => {
    try {
      // 로그인 API 호출은 TopBar의 별도 파일에서 처리됩니다
      set({ isLoggedIn: true });
    } catch (error) {
      console.error('로그인 실패:', error);
    }
  },
  
  logout: () => {
    set({ isLoggedIn: false, user: null });
  },
  
  setUser: (user: { name: string; id?: string }) => {
    set({ user, isLoggedIn: true });
  },
}));

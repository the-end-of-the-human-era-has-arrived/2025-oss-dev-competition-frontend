import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { AuthState, User } from '../types';
import authService from '../services/authService';

// 초기 상태
const initialState: AuthState = {
  isLoggedIn: false,
  user: null,
  loading: true,
  error: null,
};

// 액션 타입
type AuthAction =
  | { type: 'AUTH_START' }
  | { type: 'LOGIN_SUCCESS'; payload: User }
  | { type: 'LOGIN_FAILURE'; payload: string }
  | { type: 'LOGOUT' }
  | { type: 'CLEAR_ERROR' }
  | { type: 'INIT_AUTH'; payload: User | null };

// 리듀서
const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'AUTH_START':
      return { ...state, loading: true, error: null };
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        isLoggedIn: true,
        user: action.payload,
        loading: false,
        error: null,
      };
    case 'LOGIN_FAILURE':
      return {
        ...state,
        isLoggedIn: false,
        user: null,
        loading: false,
        error: action.payload,
      };
    case 'LOGOUT':
      return {
        ...state,
        isLoggedIn: false,
        user: null,
        loading: false,
        error: null,
      };
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    case 'INIT_AUTH':
      return {
        ...state,
        isLoggedIn: !!action.payload,
        user: action.payload,
        loading: false,
        error: null,
      };
    default:
      return state;
  }
};

// 컨텍스트 생성
interface AuthContextType extends AuthState {
  loginWithNotion: (code: string) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider 컴포넌트
interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // 앱 초기화 시 토큰 확인
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const user = await authService.getCurrentUser();
        dispatch({ type: 'INIT_AUTH', payload: user });
      } catch (error) {
        dispatch({ type: 'INIT_AUTH', payload: null });
      }
    };

    initializeAuth();
  }, []);

  const loginWithNotion = async (code: string) => {
    try {
      dispatch({ type: 'AUTH_START' });
      const user = await authService.loginWithNotion(code);
      dispatch({ type: 'LOGIN_SUCCESS', payload: user });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      dispatch({ type: 'LOGIN_FAILURE', payload: errorMessage });
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      dispatch({ type: 'LOGOUT' });
    }
  };

  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  const value: AuthContextType = {
    ...state,
    loginWithNotion,
    logout,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Hook
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

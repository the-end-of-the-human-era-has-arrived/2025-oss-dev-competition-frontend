import React from 'react';
import { useAuthStore } from '../../stores/authStore';

// 인증 관련 API 호출 함수들을 관리하는 파일
export const useAuthApi = () => {
  const { setUser, logout } = useAuthStore();

  const handleLogin = () => {
    // 현재 페이지를 저장하고 직접 이동
    sessionStorage.setItem('returnUrl', window.location.href);
    window.location.href = 'http://localhost:8080/auth/notion';
  };

  // 인증 상태를 확인하는 함수 (sessionID 쿠키 기반)
  const checkAuthStatus = async () => {
    try {
      const response = await fetch('http://localhost:8080/api/session/status', {
        method: 'GET',
        credentials: 'include', // sessionID 쿠키 포함
      });

      if (response.ok) {
        const userData = await response.json();
        if (userData.authenticated && userData.user_id) {
          // 백엔드에서 user_id로 반환하므로 언더스코어 사용
          setUser({ 
            name: `사용자-${userData.user_id.toString().slice(0, 8)}`,
            id: userData.user_id.toString()
          });
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error('인증 상태 확인 실패:', error);
      return false;
    }
  };

  const handleLogout = () => {
    logout();
  };

  return {
    handleLogin,
    handleLogout,
    checkAuthStatus,
  };
};

// 로그인 버튼 컴포넌트
export const LoginButton: React.FC<{ className?: string }> = ({ className }) => {
  const { handleLogin } = useAuthApi();

  return (
    <button className={className} onClick={handleLogin} aria-label="로그인">
      <img
        alt="노션 아이콘"
        width={16}
        height={16}
        src="/notion.png"
        style={{ marginRight: 6, verticalAlign: '-2px' }}
        onError={(e) => {
          (e.target as HTMLImageElement).src = '/favicon.png';
        }}
      />
      로그인
    </button>
  );
};

// 로그아웃 버튼 컴포넌트
export const LogoutButton: React.FC<{ className?: string; userName?: string }> = ({ className, userName }) => {
  const { handleLogout } = useAuthApi();

  return (
    <>
      {userName && <span>{userName}</span>}
      <button className={className} onClick={handleLogout}>
        로그아웃
      </button>
    </>
  );
};

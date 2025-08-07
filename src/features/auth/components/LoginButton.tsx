import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import styles from './LoginButton.module.css';

const LoginButton: React.FC = () => {
  const { loginWithNotion, loading, error } = useAuth();

  const handleNotionLogin = () => {
    const notionClientId = process.env.REACT_APP_NOTION_CLIENT_ID;
    const redirectUri = `${window.location.origin}/auth/callback`;
    
    const notionAuthUrl = `https://api.notion.com/v1/oauth/authorize?client_id=${notionClientId}&response_type=code&owner=user&redirect_uri=${encodeURIComponent(redirectUri)}`;
    
    window.location.href = notionAuthUrl;
  };

  return (
    <div className={styles.container}>
      {error && (
        <div className={styles.error}>
          {error}
        </div>
      )}
      <button
        onClick={handleNotionLogin}
        disabled={loading}
        className={styles.loginButton}
      >
        {loading ? (
          <span className={styles.loading}>로그인 중...</span>
        ) : (
          <>
            <span className={styles.icon}>📝</span>
            <span className={styles.text}>Notion으로 로그인</span>
          </>
        )}
      </button>
    </div>
  );
};

export default LoginButton;

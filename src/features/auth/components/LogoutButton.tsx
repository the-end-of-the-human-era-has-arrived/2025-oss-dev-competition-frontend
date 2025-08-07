import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import styles from './LogoutButton.module.css';

const LogoutButton: React.FC = () => {
  const { logout, loading } = useAuth();

  const handleLogout = async () => {
    if (window.confirm('정말 로그아웃하시겠습니까?')) {
      await logout();
    }
  };

  return (
    <button
      onClick={handleLogout}
      disabled={loading}
      className={styles.logoutButton}
      title="로그아웃"
    >
      {loading ? (
        <span className={styles.loading}>로그아웃 중...</span>
      ) : (
        <>
          <span className={styles.icon}>🚪</span>
          <span className={styles.text}>로그아웃</span>
        </>
      )}
    </button>
  );
};

export default LogoutButton;

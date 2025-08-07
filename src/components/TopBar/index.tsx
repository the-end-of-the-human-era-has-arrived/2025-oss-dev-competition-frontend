import React from 'react';
import styles from './TopBar.module.css';

interface TopBarProps {
  isLoggedIn: boolean;
  onLogin: () => void;
  onLogout: () => void;
}

const TopBar: React.FC<TopBarProps> = ({ isLoggedIn, onLogin, onLogout }) => {
  return (
    <header className={styles.header}>
      <div className={styles.title}>Notion Agent</div>
      <div className={styles.userInfo}>
        {isLoggedIn ? (
          <>
            <span className={styles.userName}>홍길동</span>
            <button className={styles.logoutButton} onClick={onLogout}>
              로그아웃
            </button>
          </>
        ) : (
          <button className={styles.loginButton} onClick={onLogin}>
            로그인
          </button>
        )}
      </div>
    </header>
  );
};

export default TopBar;
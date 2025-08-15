import React from 'react';
import styles from './TopBar.module.css';
import { useAuthStore } from '../../stores/authStore';
import { LoginButton, LogoutButton } from './authApi';

const TopBar: React.FC = () => {
  const { isLoggedIn, user } = useAuthStore();

  return (
    <header className={styles.header}>
      <div className={styles.title}>
        <img 
          src="/favicon.png" 
          alt="Notion Agent Logo" 
          className={styles.logo}
        />
        Notion Agent
      </div>
      <div className={styles.userInfo}>
        {isLoggedIn ? (
          <div className={styles.loggedInUser}>
            <span className={styles.userName}>{user?.name || '사용자'}</span>
            <LogoutButton className={styles.logoutButton} />
          </div>
        ) : (
          <LoginButton className={styles.loginButton} />
        )}
      </div>
    </header>
  );
};

export default TopBar;
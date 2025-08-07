import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import styles from './TopBar.module.css';

const TopBar: React.FC = () => {
  const { isLoggedIn, user, logout } = useAuth();

  return (
    <header className={styles.header}>
      <div className={styles.title}>Notion Agent</div>
      <div className={styles.userInfo}>
        {isLoggedIn && user ? (
          <>
            <span className={styles.userName}>{user.name}</span>
            {user.avatar && (
              <img
                src={user.avatar}
                alt="profile"
                className={styles.profileImage}
              />
            )}
            <button className={styles.logoutButton} onClick={logout}>
              로그아웃
            </button>
          </>
        ) : (
          <div className={styles.loginButtons}>
            {/* 소셜 로그인 버튼들이 여기에 추가될 예정 */}
            <button className={styles.loginButton}>
              로그인
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

export default TopBar;
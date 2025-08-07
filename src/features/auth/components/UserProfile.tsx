import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import LogoutButton from './LogoutButton';
import styles from './UserProfile.module.css';

const UserProfile: React.FC = () => {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <div className={styles.container}>
      <div className={styles.userInfo}>
        {user.avatar && (
          <img 
            src={user.avatar} 
            alt={user.name}
            className={styles.avatar}
          />
        )}
        <div className={styles.userDetails}>
          <div className={styles.userName}>{user.name}</div>
          <div className={styles.userEmail}>{user.email}</div>
          {user.provider && (
            <div className={styles.provider}>
              {user.provider === 'notion' && '📝 Notion'}
            </div>
          )}
        </div>
      </div>
      <LogoutButton />
    </div>
  );
};

export default UserProfile;

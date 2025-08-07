import React from 'react';
import styles from './LoadingSpinner.module.css';

interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  color?: string;
  className?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'medium', 
  color = '#667eea',
  className = '' 
}) => {
  return (
    <div className={`${styles.spinner} ${styles[size]} ${className}`}>
      <div 
        className={styles.spinnerInner}
        style={{ borderTopColor: color }}
      />
    </div>
  );
};

export default LoadingSpinner;

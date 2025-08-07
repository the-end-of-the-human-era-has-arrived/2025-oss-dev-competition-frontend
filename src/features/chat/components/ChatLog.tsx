import React from 'react';
import { Message } from '../types';
import styles from './ChatLog.module.css';

interface ChatLogProps {
  messages: Message[];
  onClear?: () => void;
  loading?: boolean;
}

const ChatLog: React.FC<ChatLogProps> = ({ messages, onClear, loading = false }) => {
  return (
    <div className={styles.container}>
      {messages.length > 0 && (
        <div className={styles.header}>
          <button 
            onClick={onClear}
            className={styles.clearButton}
            title="대화 기록 삭제"
          >
            🗑️ 대화 기록 삭제
          </button>
        </div>
      )}
      {messages.length === 0 && !loading && (
        <div className={styles.welcomeMessage}>
          <div className={styles.welcomeIcon}>💬</div>
          <div className={styles.welcomeText}>
            노션에 작성했던 내용에 관해 무엇이든 질문하세요.
          </div>
        </div>
      )}
      {messages.map((msg, idx) => (
        <div
          key={msg.id || idx}
          className={`${styles.messageContainer} ${msg.sender === 'ai' ? styles.messageContainerAi : ''}`}
        >
          <div
            className={`${styles.messageBubble} ${msg.sender === 'ai' ? styles.messageBubbleAi : ''}`}
          >
            {msg.text}
          </div>
          <div className={styles.messageTime}>
            {msg.timestamp.toLocaleTimeString()}
          </div>
        </div>
      ))}
      {loading && (
        <div className={`${styles.messageContainer} ${styles.messageContainerAi}`}>
          <div className={`${styles.messageBubble} ${styles.messageBubbleAi} ${styles.typing}`}>
            <span className={styles.typingDot}>●</span>
            <span className={styles.typingDot}>●</span>
            <span className={styles.typingDot}>●</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatLog;

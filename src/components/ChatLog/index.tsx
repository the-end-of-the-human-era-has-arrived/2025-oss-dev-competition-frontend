import React from 'react';
import { Message } from '../../types';
import styles from './ChatLog.module.css';

interface ChatLogProps {
  messages: Message[];
  onClear?: () => void;
}

const ChatLog: React.FC<ChatLogProps> = ({ messages, onClear }) => {
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
      {messages.length === 0 && (
        <div className={styles.welcomeMessage}>
          <div className={styles.welcomeIcon}>💬</div>
          <div className={styles.welcomeText}>
            노션에 작성했던 내용에 관해 무엇이든 질문하세요.
          </div>
        </div>
      )}
      {messages.map((msg, idx) => (
        <div
          key={idx}
          className={`${styles.messageContainer} ${msg.sender === 'ai' ? styles.messageContainerAi : ''}`}
        >
          <div
            className={`${styles.messageBubble} ${msg.sender === 'ai' ? styles.messageBubbleAi : ''}`}
          >
            {msg.text}
          </div>
        </div>
      ))}
    </div>
  );
};

export type { Message };
export default ChatLog;
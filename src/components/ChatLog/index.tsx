import React, { useRef, useEffect } from 'react';
import MarkdownRenderer from '../MarkdownRenderer';
import styles from './ChatLog.module.css';

type Message = {
  sender: 'user' | 'ai';
  text: string;
};

type ChatLogProps = {
  messages: Message[];
  onClear?: () => void;
  isLoading?: boolean;
};

const ChatLog: React.FC<ChatLogProps> = ({ messages, onClear, isLoading = false }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // 메시지나 로딩 상태가 변경될 때마다 스크롤을 맨 아래로 이동
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  return (
    <div ref={containerRef} className={styles.container}>
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
            <MarkdownRenderer 
              content={msg.text} 
              className={`${styles.markdownContent} ${msg.sender === 'user' ? styles.userMarkdown : ''}`} 
            />
          </div>
        </div>
      ))}
      {isLoading && (
        <div className={styles.loadingContainer}>
          <div className={styles.loadingBubble}>
            AI가 응답을 생성하고 있습니다
            <div className={styles.loadingDots}>
              <div className={styles.loadingDot}></div>
              <div className={styles.loadingDot}></div>
              <div className={styles.loadingDot}></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export type { Message };
export default ChatLog;
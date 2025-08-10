import React, { useState } from 'react';
import ChatLog, { Message } from './components/ChatLog';
import ChatInput from './components/ChatInput';
import MindMap from './components/MindMap';
import TopBar from './components/TopBar';
import styles from './App.module.css';

// 더미 출처 데이터
const sources = [
  { id: 1, title: '프로젝트 기획서', url: 'https://notion.so/project-plan' },
  { id: 2, title: '기술 스택 문서', url: 'https://notion.so/tech-stack' },
  { id: 3, title: 'API 설계 문서', url: 'https://notion.so/api-design' },
];

const App: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const handleSend = (text: string) => {
    setMessages(prev => [...prev, { sender: 'user', text }]);
    setTimeout(() => {
      setMessages(prev => [...prev, { sender: 'ai', text: text }]);
    }, 500);
  };

  return (
    <div className={styles.container}>
      <TopBar isLoggedIn={isLoggedIn} onLogin={() => setIsLoggedIn(true)} onLogout={() => setIsLoggedIn(false)} />
      <div className={styles.topBarSpacer} />
      {isLoggedIn ? (
        <div className={styles.mainContent}>
          {/* 채팅 카드: 좌측에 고정 */}
          <div className={styles.chatCard}>
            <div className={styles.chatHeader}>
              <h2 className={styles.chatTitle}>AI Agent Chat</h2>
            </div>
            <ChatLog messages={messages} onClear={() => setMessages([])} />
            <div className={styles.chatInputContainer}>
              <ChatInput onSend={handleSend} />
            </div>
          </div>
          {/* 마인드맵 영역: 우측에 수직 분리 */}
          <div className={styles.mindmapSection}>
            {/* 마인드맵 카드 (2/3) */}
            <div className={styles.mindmapCard}>
              <div className={styles.mindmapTitle}>👣</div>
              <div className={styles.mindmapContent}>
                <MindMap />
              </div>
            </div>
            {/* 출처 카드 (1/3) */}
            <div className={styles.sourcesCard}>
              <div className={styles.sourcesHeader}>
                <h3 className={styles.sourcesTitle}>📚 참고 출처</h3>
              </div>
              <div className={styles.sourcesList}>
                {sources.map(source => (
                  <div key={source.id} className={styles.sourceItem}>
                    <a 
                      href={source.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className={styles.sourceLink}
                    >
                      {source.title}
                    </a>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className={styles.introContent}>
          <div className={styles.introCard}>
            <h1 className={styles.introTitle}>Notion Agent</h1>
            <p className={styles.introDescription}>
              AI 기반 마인드맵 생성 및 채팅 서비스
            </p>
            <div className={styles.introFeatures}>
              <div className={styles.feature}>
                <span className={styles.featureIcon}>🧠</span>
                <span className={styles.featureText}>지능형 마인드맵 생성</span>
              </div>
              <div className={styles.feature}>
                <span className={styles.featureIcon}>💬</span>
                <span className={styles.featureText}>AI 채팅 어시스턴트</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;

import React, { useState } from 'react';
import ChatLog, { Message } from './components/ChatLog';
import ChatInput from './components/ChatInput';
import MindMap from './components/MindMap';
import TopBar from './components/TopBar';
import styles from './App.module.css';

const App: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [showChat, setShowChat] = useState(false);
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
          {/* 마인드맵 카드: showChat에 따라 width/flex 조절 */}
          <div
            className={styles.mindmapCard}
            style={{
              width: showChat ? '33%' : '90%',
              maxWidth: showChat ? '33%' : '90%',
            }}
          >
            <div className={styles.mindmapTitle}>👣</div>
            <div className={styles.mindmapContent}>
              <MindMap />
            </div>
          </div>
          {/* 채팅 parent 카드: showChat true일 때만 오른쪽에 슬라이드 인 */}
          <div
            className={`${styles.chatCard} ${showChat ? styles.chatCardVisible : styles.chatCardHidden}`}
          >
            {showChat && (
              <>
                <div className={styles.chatHeader}>
                  <h2 className={styles.chatTitle}>AI Agent Chat</h2>
                  <button
                    onClick={() => setShowChat(false)}
                    className={styles.closeButton}
                    title="채팅 닫기"
                  >
                    ×
                  </button>
                </div>
                <ChatLog messages={messages} onClear={() => setMessages([])} />
                <div className={styles.chatInputContainer}>
                  <ChatInput onSend={handleSend} />
                </div>
              </>
            )}
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
      {/* 채팅 열기 플로팅 버튼 (로그인 후, 채팅이 닫혀 있을 때만) */}
      {isLoggedIn && !showChat && (
        <button
          onClick={() => setShowChat(true)}
          className={styles.floatingButton}
        >
          💬
        </button>
      )}
    </div>
  );
};

export default App;

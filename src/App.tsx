import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './features/auth';
import { ChatProvider, useChat } from './features/chat';
import { MindMapProvider, useMindMap } from './features/mindmap';
import ChatLog from './features/chat/components/ChatLog';
import ChatInput from './features/chat/components/ChatInput';
import MindMap from './features/mindmap/components/MindMap';
import TopBar from './components/TopBar';
import LoginButton from './features/auth/components/LoginButton';
import UserProfile from './features/auth/components/UserProfile';
import styles from './App.module.css';

const AppContent: React.FC = () => {
  const [showChat, setShowChat] = useState(false);
  const { isLoggedIn, loading: authLoading } = useAuth();
  const { messages, loading: chatLoading, sendMessage, clearMessages } = useChat();

  const handleSend = async (text: string) => {
    await sendMessage(text);
  };

  const handleClear = () => {
    clearMessages();
  };

  if (authLoading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner}></div>
        <div className={styles.loadingText}>로딩 중...</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <TopBar />
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
            <div className={styles.mindmapTitle}>mindmap</div>
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
                <ChatLog 
                  messages={messages} 
                  onClear={handleClear}
                  loading={chatLoading}
                />
                <div className={styles.chatInputContainer}>
                  <ChatInput onSend={handleSend} disabled={chatLoading} />
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
            <div className={styles.loginSection}>
              <LoginButton />
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

const App: React.FC = () => {
  return (
    <AuthProvider>
      <ChatProvider>
        <MindMapProvider>
          <AppContent />
        </MindMapProvider>
      </ChatProvider>
    </AuthProvider>
  );
};

export default App;

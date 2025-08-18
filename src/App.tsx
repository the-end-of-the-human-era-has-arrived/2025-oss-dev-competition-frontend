import React, { useState, useEffect } from 'react';
import ChatLog, { Message } from './components/ChatLog';
import ChatInput from './components/ChatInput';
import MindMap from './components/MindMap';
import TopBar from './components/TopBar';
import { useAuthStore } from './stores/authStore';
import { sendChatMessage, ChatApiError, ChatMessage } from './services/chatApi';
import styles from './App.module.css';

type Source = {
  id: string;
  title: string;
  url: string;
};

// Message 타입을 ChatMessage 타입으로 변환하는 함수
const convertToChatMessages = (messages: Message[]): ChatMessage[] => {
  return messages.map(msg => ({
    type: msg.sender === 'user' ? 'user' : 'ai',
    content: msg.text
  }));
};

const App: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { isLoggedIn, setUser, user } = useAuthStore();
  const [sources, setSources] = useState<Source[]>([]);

  // AI 응답 텍스트에서 마크다운 링크와 일반 URL을 추출해 출처 목록 생성
  const extractSourcesFromMarkdown = (text: string): Source[] => {
    const results: Source[] = [];
    const seen = new Set<string>();

    // [title](url) 형태의 마크다운 링크 추출
    const mdLinkRegex = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g;
    let match: RegExpExecArray | null;
    while ((match = mdLinkRegex.exec(text)) !== null) {
      const title = (match[1] || '').trim();
      const url = (match[2] || '').trim();
      if (url && !seen.has(url)) {
        seen.add(url);
        results.push({ id: url, title: title || url, url });
      }
    }

    // 일반 URL도 보조적으로 추출 (중복은 제거)
    const rawUrlRegex = /(https?:\/\/[^\s)]+)/g;
    while ((match = rawUrlRegex.exec(text)) !== null) {
      const url = (match[1] || '').trim();
      if (url && !seen.has(url)) {
        seen.add(url);
        results.push({ id: url, title: url, url });
      }
    }

    return results;
  };

  // AI 응답 내 sources-json 코드펜스를 우선 파싱하여 출처를 추출하고, 본문에서 제거해 반환
  const parseSourcesJsonBlock = (text: string): { body: string; sources: Source[] } => {
    // ```sources-json\n ... \n```
    const fenceRegex = /```sources-json\n([\s\S]*?)\n```/i;
    const m = fenceRegex.exec(text);
    if (!m) {
      return { body: text, sources: [] };
    }
    const jsonRaw = m[1];
    try {
      const arr = JSON.parse(jsonRaw);
      const parsed: Source[] = Array.isArray(arr)
        ? arr
            .filter((x: any) => x && typeof x.url === 'string')
            .map((x: any) => ({ id: x.url, title: (x.title || x.url) as string, url: x.url as string }))
        : [];
      const body = text.replace(fenceRegex, '').trim();
      return { body, sources: parsed };
    } catch {
      // JSON 파싱 실패 시, 본문만 제거하지 않고 그대로 두고, 출처는 없음
      return { body: text.replace(fenceRegex, '').trim(), sources: [] };
    }
  };

  // 페이지 로드 시 인증 상태 확인
  useEffect(() => {
    const checkInitialAuthStatus = async () => {
      // URL 파라미터에서 인증 성공 여부 확인
      const urlParams = new URLSearchParams(window.location.search);
      const authSuccess = urlParams.get('auth');
      
      if (authSuccess === 'success') {
        // URL에서 auth 파라미터 제거
        const newUrl = window.location.pathname;
        window.history.replaceState({}, document.title, newUrl);
      }

      // 항상 백엔드 API로 인증 상태 확인 (sessionID 쿠키 기반)
      try {
        const response = await fetch('http://localhost:8080/api/session/status', {
          method: 'GET',
          credentials: 'include', // sessionID 쿠키 포함
        });

        if (response.ok) {
          const userData = await response.json();
          if (userData.authenticated && userData.user_id) {
            // 백엔드에서 user_id로 반환하므로 언더스코어 사용
            setUser({ 
              name: `사용자-${userData.user_id.toString().slice(0, 8)}`,
              id: userData.user_id.toString()
            });
          }
        }
      } catch (error) {
        // 백엔드 API가 없거나 실패해도 계속 진행
        console.log('인증 상태 확인 실패:', error);
      }
    };

    checkInitialAuthStatus();
  }, [setUser]);

  const handleSend = async (text: string) => {
    // 현재 채팅창의 모든 대화 기록을 ChatMessage 형식으로 변환
    const chatHistory = convertToChatMessages(messages);
    
    // 사용자 메시지 즉시 추가
    setMessages(prev => [...prev, { sender: 'user', text }]);
    setIsLoading(true);

    try {
      // AI API 호출 (현재 채팅창의 모든 대화 기록 포함)
      const aiResponse = await sendChatMessage(text, user?.id || 'anonymous', chatHistory);
      
      // 로깅: 화면에 찍히기 전 AI 원문 응답 출력
      console.log("AI raw response (before render):", aiResponse);
      // 1) sources-json 코드펜스 우선 파싱
      const { body, sources: parsedSources } = parseSourcesJsonBlock(aiResponse);
      if (parsedSources.length > 0) {
        setSources(parsedSources);
      } else {
        // 2) 없으면 마크다운/URL 백업 추출
        const fallback = extractSourcesFromMarkdown(aiResponse);
        setSources(fallback);
      }
      // AI 응답 추가 (sources-json 블록은 제거된 본문 사용)
      setMessages(prev => [...prev, { sender: 'ai', text: body }]);
    } catch (error) {
      console.error('AI 채팅 오류:', error);
      
      let errorMessage = '죄송합니다. 응답을 생성하는 중 오류가 발생했습니다.';
      
      if (error instanceof ChatApiError) {
        errorMessage = error.message;
      }
      
      // 에러 메시지를 AI 응답으로 표시
      setMessages(prev => [...prev, { 
        sender: 'ai', 
        text: `⚠️ ${errorMessage} 다시 시도해주세요.` 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <TopBar />
      <div className={styles.topBarSpacer} />
      {isLoggedIn ? (
        <div className={styles.mainContent}>
          {/* 채팅 카드: 좌측에 고정 */}
          <div className={styles.chatCard}>
            <div className={styles.chatHeader}>
              <h2 className={styles.chatTitle}>AI Agent Chat</h2>
            </div>
            <ChatLog messages={messages} onClear={() => setMessages([])} isLoading={isLoading} />
            <div className={styles.chatInputContainer}>
              <ChatInput onSend={handleSend} isLoading={isLoading} />
            </div>
          </div>
          {/* 마인드맵 영역: 우측에 수직 분리 */}
          <div className={styles.mindmapSection}>
            {/* 마인드맵 카드 (2/3) */}
            <div className={styles.mindmapCard}>
              <div className={styles.mindmapTitle}></div>
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
                {sources.length === 0 ? (
                  <div className={styles.sourceItem}>
                    <span className={styles.sourceLink} style={{ background: 'transparent', border: 'none', color: '#787774' }}>
                      참고한 Notion 페이지가 있다면 이곳에 표시됩니다.
                    </span>
                  </div>
                ) : (
                  sources.map(source => (
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
                  ))
                )}
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

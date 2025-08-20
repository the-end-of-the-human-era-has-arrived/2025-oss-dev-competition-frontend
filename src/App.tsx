import React, { useState, useEffect, useRef, useCallback } from "react";
import ChatLog, { Message } from "./components/ChatLog";
import ChatInput from "./components/ChatInput";
import MindMap from "./components/MindMap";
import TopBar from "./components/TopBar";
import { useAuthStore } from "./stores/authStore";
import { LoginButton } from "./components/TopBar/authApi";
import {
  sendChatMessage,
  ChatApiError,
  ChatMessage,
  initializeUserEnvironment,
} from "./services/chatApi";
import styles from "./App.module.css";

type Source = {
  id: string;
  title: string;
  url: string;
};

// Message 타입을 ChatMessage 타입으로 변환하는 함수
const convertToChatMessages = (messages: Message[]): ChatMessage[] => {
  return messages.map((msg) => ({
    type: msg.sender === "user" ? "user" : "ai",
    content: msg.text,
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
      const title = (match[1] || "").trim();
      const url = (match[2] || "").trim();
      if (url && !seen.has(url)) {
        seen.add(url);
        results.push({ id: url, title: title || url, url });
      }
    }

    // 일반 URL도 보조적으로 추출 (중복은 제거)
    const rawUrlRegex = /(https?:\/\/[^\s)]+)/g;
    while ((match = rawUrlRegex.exec(text)) !== null) {
      const url = (match[1] || "").trim();
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
            .filter((x: any) => x && typeof x.url === "string")
            .map((x: any) => ({ id: x.url, title: (x.title || x.url) as string, url: x.url as string }))
        : [];
      const body = text.replace(fenceRegex, "").trim();
      return { body, sources: parsed };
    } catch {
      // JSON 파싱 실패 시, 본문만 제거하지 않고 그대로 두고, 출처는 없음
      return { body: text.replace(fenceRegex, "").trim(), sources: [] };
    }
  };

  // 시스템 초기화 상태 관리
  const [systemInitialized, setSystemInitialized] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);

  // 초기화 실행 방지를 위한 ref (중복 호출 완전 차단)
  const initializationRunning = useRef(false);

  // 백그라운드 시스템 환경 초기화 함수
  const initializeSystemEnvironment = useCallback(
    async (userId: string) => {
      // 중복 실행 완전 차단
      if (initializationRunning.current || isInitializing || systemInitialized) {
        console.log("[System Init] 이미 초기화 중이거나 완료됨 (중복 호출 차단)");
        return;
      }

      // localStorage에서 초기화 상태 확인 (페이지 새로고침 시에도 유지)
      const initKey = `system_init_${userId}`;
      const previousInit = localStorage.getItem(initKey);
      if (previousInit === "completed") {
        console.log("[System Init] 이전에 초기화 완료됨");
        setSystemInitialized(true);
        return;
      }

      // 초기화 시작 - 플래그 설정
      initializationRunning.current = true;
      setIsInitializing(true);
      console.log("[System Init] 백그라운드 초기화 시작...");

      try {
        // 재시도 로직 (최대 3회)
        let success = false;
        for (let attempt = 1; attempt <= 3; attempt++) {
          console.log(`[System Init] 시도 ${attempt}/3`);
          success = await initializeUserEnvironment(userId);

          if (success) {
            break;
          } else if (attempt < 3) {
            // 재시도 전 2초 대기
            console.log(`[System Init] ${attempt}번째 시도 실패, 2초 후 재시도...`);
            await new Promise((resolve) => setTimeout(resolve, 2000));
          }
        }

        if (success) {
          console.log("[System Init] 백그라운드 초기화 완료");
          setSystemInitialized(true);
          localStorage.setItem(initKey, "completed");
        } else {
          console.warn("[System Init] 모든 시도 실패 - 앱은 정상적으로 사용 가능");
        }
      } catch (error) {
        console.error("[System Init] 초기화 중 예외 발생:", error);
      } finally {
        // 초기화 완료 - 플래그 해제
        initializationRunning.current = false;
        setIsInitializing(false);
      }
    },
    [isInitializing, systemInitialized]
  );

  // 페이지 로드 시 인증 상태 확인
  useEffect(() => {
    const checkInitialAuthStatus = async () => {
      // URL 파라미터에서 인증 성공 여부 확인
      const urlParams = new URLSearchParams(window.location.search);
      const authSuccess = urlParams.get("auth");

      if (authSuccess === "success") {
        // URL에서 auth 파라미터 제거
        const newUrl = window.location.pathname;
        window.history.replaceState({}, document.title, newUrl);
      }

      // 항상 백엔드 API로 인증 상태 확인 (sessionID 쿠키 기반)
      try {
        const response = await fetch("http://localhost:8080/api/session/status", {
          method: "GET",
          credentials: "include", // sessionID 쿠키 포함
        });

        if (response.ok) {
          const userData = await response.json();
          if (userData.authenticated && userData.user_id) {
            // 백엔드에서 user_id로 반환하므로 언더스코어 사용
            const userId = userData.user_id.toString();
            setUser({
              name: `사용자-${userId.slice(0, 8)}`,
              id: userId,
            });

            // 백그라운드 시스템 초기화는 별도 useEffect에서 처리
          }
        }
      } catch (error) {
        // 백엔드 API가 없거나 실패해도 계속 진행
        console.log("인증 상태 확인 실패:", error);
      }
    };

    checkInitialAuthStatus();
  }, [setUser]);

  // 사용자 로그인 후 백그라운드 초기화 실행
  useEffect(() => {
    if (user?.id && !isInitializing && !systemInitialized) {
      const initKey = `system_init_${user.id}`;
      const previousInit = localStorage.getItem(initKey);

      // 이전에 초기화가 완료되지 않은 경우에만 실행
      if (previousInit !== "completed") {
        console.log("[System Init] 사용자 로그인 감지, 초기화 시작");
        initializeSystemEnvironment(user.id);
      }
    }
  }, [user?.id, isInitializing, systemInitialized, initializeSystemEnvironment]);

  const handleSend = async (text: string) => {
    // 현재 채팅창의 모든 대화 기록을 ChatMessage 형식으로 변환
    const chatHistory = convertToChatMessages(messages);

    // 사용자 메시지 즉시 추가
    setMessages((prev) => [...prev, { sender: "user", text }]);
    setIsLoading(true);

    try {
      // AI API 호출 (현재 채팅창의 모든 대화 기록 포함)
      const aiResponse = await sendChatMessage(text, user?.id || "anonymous", chatHistory);

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
      setMessages((prev) => [...prev, { sender: "ai", text: body }]);
    } catch (error) {
      console.error("AI 채팅 오류:", error);

      let errorMessage = "죄송합니다. 응답을 생성하는 중 오류가 발생했습니다.";

      if (error instanceof ChatApiError) {
        errorMessage = error.message;
      }

      // 에러 메시지를 AI 응답으로 표시
      setMessages((prev) => [
        ...prev,
        {
          sender: "ai",
          text: `⚠️ ${errorMessage} 다시 시도해주세요.`,
        },
      ]);
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
                <MindMap systemInitialized={systemInitialized} />
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
                    <span
                      className={styles.sourceLink}
                      style={{ background: "transparent", border: "none", color: "#787774" }}
                    >
                      참고한 Notion 페이지가 있다면 이곳에 표시됩니다.
                    </span>
                  </div>
                ) : (
                  sources.map((source) => (
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
          <section className={styles.heroSection}>
            <h1 className={styles.heroTitle}>Notion Agent</h1>
            <p className={styles.heroDescription}>
              내가 작성한 내용에 대해 질문하면 내 노션의 모든 관련 내용을 정리해 답하고,
              근거가 된 노션 페이지의 출처를 즉시 확인할 수 있어요. 글에서 추출된 키워드는 마인드맵으로
              한눈에 파악할 수 있습니다.
            </p>
            <div className={styles.heroCtas}>
              <LoginButton className={styles.primaryButton} />
              <a href="#features" className={styles.secondaryButton}>기능 살펴보기</a>
            </div>
          </section>

          <section id="features" className={styles.featuresSection}>
            <div className={styles.featuresGrid}>
              <div className={styles.featureCard}>
                <div className={styles.featureCardIcon}>💬</div>
                <h3 className={styles.featureCardTitle}>주제별 통합 답변</h3>
                <p className={styles.featureCardDesc}>
                  노션 전반에서 해당 주제와 관련된 내용을 모아 요약하고 정리해 드립니다.
                </p>
              </div>
              <div className={styles.featureCard}>
                <div className={styles.featureCardIcon}>🧠</div>
                <h3 className={styles.featureCardTitle}>키워드 마인드맵</h3>
                <p className={styles.featureCardDesc}>
                  문서에서 추출된 핵심 개념들이 시각적으로 연결되어 흐름을 빠르게 이해할 수 있어요.
                </p>
              </div>
              <div className={styles.featureCard}>
                <div className={styles.featureCardIcon}>🔗</div>
                <h3 className={styles.featureCardTitle}>출처 링크 제공</h3>
                <p className={styles.featureCardDesc}>
                  LLM 응답에 활용된 노션 페이지를 출처로 보여주며, 한 클릭으로 원문으로 이동합니다.
                </p>
              </div>
            </div>
          </section>

          <section className={styles.demoSection}>
            <div className={styles.demoGrid}>
              <div className={`${styles.demoCard} ${styles.demoChatCard}`}>
                <div className={styles.demoCardHeader}>채팅 미리보기</div>
                <div className={styles.demoChatReal}>
                  <div className={styles.chatPreview}>
                    <div className={`${styles.chatPreviewRow} ${styles.chatPreviewRowUser}`}>
                      <div className={styles.chatPreviewBubbleUser}>
                        OKR 작성 베스트 프랙티스 알려줘. 기존에 정리한 문서가 있으면 함께 참고해줘.
                      </div>
                    </div>
                    <div className={`${styles.chatPreviewRow} ${styles.chatPreviewRowAi}`}>
                      <div className={styles.chatPreviewBubbleAi}>
                        <p style={{ marginTop: 0 }}>OKR은 목표(Objective)와 핵심결과(Key Results)로 구성되며, 팀과 개인의 정렬과 성과 측정을 동시에 달성하는 경량 프레임워크입니다. 다음 원칙을 지키면 품질이 크게 향상됩니다.</p>
                        <ul>
                          <li>Objective: 고객 가치 중심의 명확한 방향(정성적)</li>
                          <li>Key Results: 기준선→목표치→기한이 있는 정량 지표</li>
                        </ul>
                        <p>팀 예시</p>
                        <ul>
                          <li>O: 온보딩 경험 개선</li>
                          <li>KR1: 첫 주 핵심기능 체험률 25%→40%</li>
                          <li>KR2: 가입→활성 전환율 +15pp</li>
                        </ul>
                        <p>개인 예시</p>
                        <ul>
                          <li>O: 실험 주도 역량 강화</li>
                          <li>KR1: 분기 A/B 4건 설계·분석</li>
                          <li>KR2: 통계 검정 템플릿 1건 배포</li>
                        </ul>
                        <p>작성 팁</p>
                        <ul style={{ marginBottom: 0 }}>
                          <li>KR엔 모호한 표현 대신 수치와 기간을 명시합니다(예: “+15pp, 3월 말”)</li>
                          <li>팀 KR과 개인 KR이 상·하향으로 연결되는지 점검합니다</li>
                          <li>월간 체크인으로 진행률을 숫자로 업데이트하고, 분기 말 회고에서 측정/학습을 문서화합니다</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className={`${styles.demoCard} ${styles.demoMindmapCard}`}>
                <div className={styles.demoCardHeader}>마인드맵 미리보기</div>
                <div className={styles.demoMindmapReal}>
                  <MindMap />
                </div>
              </div>
              <div className={`${styles.demoCard} ${styles.demoSourcesCard}`}>
                <div className={styles.sourcesHeader}>
                  <h3 className={styles.sourcesTitle}>출처 미리보기</h3>
                </div>
                <div className={styles.sourcesList}>
                  <div className={styles.sourceItem}>
                    <a className={styles.sourceLink} href="#" onClick={(e) => e.preventDefault()}>OKR 가이드라인</a>
                  </div>
                  <div className={styles.sourceItem}>
                    <a className={styles.sourceLink} href="#" onClick={(e) => e.preventDefault()}>분기별 목표 수립 체크리스트</a>
                  </div>
                  <div className={styles.sourceItem}>
                    <a className={styles.sourceLink} href="#" onClick={(e) => e.preventDefault()}>팀/개인 OKR 예시 모음</a>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className={styles.stepsSection}>
            <div className={styles.stepsGrid}>
              <div className={styles.stepCard}>
                <div className={styles.stepIndex}>1</div>
                <div className={styles.stepTitle}>노션으로 로그인</div>
                <div className={styles.stepDesc}>안전한 연결 후, 내 워크스페이스의 지식에 접근합니다.</div>
              </div>
              <div className={styles.stepCard}>
                <div className={styles.stepIndex}>2</div>
                <div className={styles.stepTitle}>질문하기</div>
                <div className={styles.stepDesc}>주제를 입력하면 관련 노션 문서를 탐색해 통합 답변을 제공합니다.</div>
              </div>
              <div className={styles.stepCard}>
                <div className={styles.stepIndex}>3</div>
                <div className={styles.stepTitle}>마인드맵·출처 탐색</div>
                <div className={styles.stepDesc}>핵심 키워드 흐름을 보고, 출처를 통해 원문으로 이동하세요.</div>
              </div>
            </div>
          </section>

          <div className={styles.footerNote}>로그인 후 전체 기능을 사용할 수 있습니다.</div>
        </div>
      )}
    </div>
  );
};

export default App;

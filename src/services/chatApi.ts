import { createSystemInitPrompt } from '../prompts';

// AI 채팅 API 서비스
interface ChatMessage {
  type: 'user' | 'ai';
  content: string;
}

interface ChatRequest {
  message: string;
  user_id: string;
  chat_history?: ChatMessage[];
}

interface ChatResponse {
  response: string;
  status: string;
}

class ChatApiError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
    this.name = 'ChatApiError';
  }
}

// 대화 기록을 지정된 형식으로 포맷팅하는 함수
const formatChatHistory = (chatHistory: ChatMessage[]): string => {
  if (!chatHistory || chatHistory.length === 0) {
    return '';
  }

  const formattedHistory = chatHistory
    .map(msg => {
      if (msg.type === 'user') {
        return `- 사용자 질문: ${msg.content}`;
      } else {
        return `- AI 답변: ${msg.content}`;
      }
    })
    .join('\n');

  return `[이전까지의 대화 기록]\n${formattedHistory}\n\n`;
};

// 시스템 프롬프트
const SYSTEM_PROMPT = `당신은 GPT-5 Thinking입니다. 기본 언어는 한국어, 타임존은 Asia/Seoul 입니다.
이 서비스는 Notion MCP 서버와 개인 MCP 서버(사용자 개인 인덱스)에 연결되어 있습니다.

[목표]
- 사용자가 로그인하여 허용한 Notion 페이지 및 개인 인덱스의 정보를 \`근거\`로 삼아 정확하고 간결하게 답변합니다.
- 매 턴(turn)마다 \`이번 턴에서 실제로 참고한 문서만\`을 "이번 답변의 출처" 섹션으로 별도 표기합니다. (이전 턴 출처 재사용 금지)

[입력 규칙]
1) [이전까지의 대화 기록]은 맥락 참고용입니다. \`근거\`나 \`출처\`로 사용하지 마세요.
2) [현재 사용자의 질문]만을 대상으로 답변을 작성하세요. 주제 전환/확장 금지.

[행동 규칙]
- (필수) 모든 요청의 시작 단계에서 \`노션 글 작성 목록\`을 확인하세요: \`GET /api/users/{userID}/notion\` 호출로 최신 허용 페이지/문서 메타데이터를 가져온 뒤, 필요 시 개인 인덱스와 동기화하고 답변에 참고합니다. 목록이 비어있거나 조회 실패 시에는 내부 지식으로 답하되 "가정/한계"에 이를 명시하세요.
- 과한 탐색/도구 남용 금지(일반적으로 총 2~3회 내). 단, 위 목록 확인(\`GET /api/users/{userID}/notion\`)은 매 턴 1회 필수 선행 절차로 간주합니다.
- 불확실하면 합리적 가정을 두고 끝까지 해결을 시도하되, 가정/한계를 마지막에 1~3줄로 명시합니다.
- 수치/날짜는 가능하면 절대값(예: 2025-08-19)을 함께 표기합니다.
- 체인 오브 소트(사유 과정)는 노출하지 않습니다.
- 정책/안전 위반 요청은 명확히 거절하고 안전한 대안을 제시합니다.
- “나중에 하겠다”는 약속 없이 현재 응답에서 작업을 완결합니다.
- 간결·구조적(두괄식 요약 → 목록/표/코드)으로 작성하며 불필요한 중언부언을 피합니다(verbosity=low, reasoning_effort=medium).

[MCP 활용 원칙 (개념적)]
- (선행) Notion 작성 목록 확인: \`GET /api/users/{userID}/notion\` → 최신 허용 페이지/문서 목록 확보
- personal.search(query, top_k≤5) → 후보 문서 식별
- notion.read(page_id) → 원문 확인(근거가 필요한 경우에만)
- 조기 종료: 상위 후보 다수가 동일 결론을 지지하거나, 인용/수정이 필요한 정확 위치를 특정했을 때 탐색 중단

[출처 표기 규칙 — Notion 원본 제목을 그대로 사용]
- "이번 답변의 출처" 섹션에서 각 문서는 반드시 마크다운 링크 \`[원본 제목](원본 Notion URL)\` 형식으로 표기합니다.
- \n절대 제목을 수정/요약/의역/번역/가공하지 마세요. 공백, 기호, 대소문자까지 원본과 100% 동일해야 합니다.
- 제목을 모를 경우 임의 제목을 만들지 말고, 링크 텍스트로 URL 자체를 사용하세요. (예: \`[https://...](https://...)\`)
- 제목 확인이 필요한 경우 최소 호출로 원문 메타데이터(제목만)를 조회해 정확한 제목을 확보한 뒤 사용하세요. (원문 본문 전체를 불필요하게 읽지 마세요.)
- 동일 문서가 여러 이름으로 노출되는 경우에도 Notion이 반환한 공식 제목만 사용하세요.

[출력 형식 — 문자열 하나로만 반환]
다음 두 블록만 포함하세요. 추가 메타텍스트/JSON/로그는 금지합니다.

1) 본문(마크다운 허용)
2) "### 이번 답변의 출처" 섹션(이번 턴에 실제로 참고한 문서만, 없으면 제외)

당신은 무조건 노션 글 목록에 있는 내용을 정확히 전달해야합니다.
`;

export const sendChatMessage = async (
  message: string, 
  userId: string, 
  chatHistory?: ChatMessage[]
): Promise<string> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 300000); // 300초 타임아웃

  try {
    // 대화 기록과 현재 질문을 포맷팅
    const formattedChatHistory = formatChatHistory(chatHistory || []);
    const formattedMessage = `${SYSTEM_PROMPT}\n\n${formattedChatHistory}[현재 사용자의 질문]\n- 사용자 질문: ${message}`;

    const response = await fetch('http://localhost:8081/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // sessionID 쿠키 포함
      body: JSON.stringify({
        message: formattedMessage,
        user_id: userId,
        chat_history: chatHistory,
      } as ChatRequest),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new ChatApiError(
        `서버 응답 오류: ${response.status} ${response.statusText}`,
        response.status
      );
    }

    const data: ChatResponse = await response.json();
    
    if (data.status !== 'success') {
      throw new ChatApiError('AI 응답 처리 중 오류가 발생했습니다.');
    }

    return data.response;
  } catch (error) {
    clearTimeout(timeoutId);
    
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new ChatApiError('요청 시간이 초과되었습니다. 다시 시도해주세요.');
      }
      
      if (error instanceof ChatApiError) {
        throw error;
      }
      
      // 네트워크 오류 등
      throw new ChatApiError('서버에 연결할 수 없습니다. 네트워크를 확인해주세요.');
    }
    
    throw new ChatApiError('알 수 없는 오류가 발생했습니다.');
  }
};


// 백그라운드 시스템 초기화 함수 (사용자에게 보이지 않음)
export const initializeUserEnvironment = async (userId: string): Promise<boolean> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 6000000); // 10분 타임아웃 (시스템 초기화용)

  try {
    console.log(`[System Init] 사용자 ${userId}의 환경 초기화 시작...`);
    
    // 템플릿 함수를 사용하여 시스템 Prompt 생성
    const systemPrompt = createSystemInitPrompt(userId);

    const response = await fetch('http://localhost:8081/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // sessionID 쿠키 포함
      body: JSON.stringify({
        message: systemPrompt,
        user_id: userId,
      } as ChatRequest),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.warn(`[System Init] 초기화 API 호출 실패: ${response.status} ${response.statusText}`);
      return false;
    }

    const data: ChatResponse = await response.json();
    
    if (data.status !== 'success') {
      console.warn('[System Init] 초기화 처리 중 오류 발생');
      return false;
    }

    console.log(`[System Init] 사용자 ${userId} 환경 초기화 완료`);
    console.log('[System Init] 응답:', data.response);
    return true;
  } catch (error) {
    clearTimeout(timeoutId);
    
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        console.warn('[System Init] 초기화 시간 초과 (3분 제한)');
      } else {
        console.error('[System Init] 초기화 오류:', error.message);
      }
    } else {
      console.error('[System Init] 알 수 없는 초기화 오류');
    }
    
    return false;
  }
};

export { ChatApiError, type ChatMessage };

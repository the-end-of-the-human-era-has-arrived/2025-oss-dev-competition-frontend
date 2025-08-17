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
const SYSTEM_PROMPT = `당신은 아래의 규칙을 무조건 따라야합니다.

1. 이전까지의 대화 기록은 당신이 무슨 맥락으로 이야기중인지 참고하는 용도입니다.

2. 대화 내용은 [이전까지의 대화 기록], [현재 사용자의 질문] 파트로 나뉩니다. 당신은 현재 사용자의 질문에 대한 내용을 작성해야합니다.

---`;

export const sendChatMessage = async (
  message: string, 
  userId: string, 
  chatHistory?: ChatMessage[]
): Promise<string> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000); // 30초 타임아웃

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

export { ChatApiError, type ChatMessage };

// AI 채팅 API 서비스
interface ChatRequest {
  message: string;
  user_id: string;
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

export const sendChatMessage = async (message: string, userId: string): Promise<string> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000); // 30초 타임아웃

  try {
    const response = await fetch('http://localhost:8081/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // sessionID 쿠키 포함
      body: JSON.stringify({
        message,
        user_id: userId,
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

export { ChatApiError };

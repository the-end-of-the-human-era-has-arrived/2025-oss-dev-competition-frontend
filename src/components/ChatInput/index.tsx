import React, { useState, FormEvent, useRef, useEffect } from 'react';
import styles from './ChatInput.module.css';

type ChatInputProps = {
  onSend: (message: string) => void;
  isLoading?: boolean;
};

const ChatInput: React.FC<ChatInputProps> = ({ onSend, isLoading = false }) => {
  const [input, setInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (input.trim() === '' || isLoading) return;
    onSend(input);
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      // Enter만 눌렀을 때: 전송
      e.preventDefault();
      if (input.trim() && !isLoading) {
        onSend(input);
        setInput('');
      }
    }
    // Shift + Enter: 기본 동작 (줄바꿈) 허용
  };

  // 자동 높이 조절
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollHeight = textareaRef.current.scrollHeight;
      const newHeight = Math.max(20, Math.min(scrollHeight, 120));
      textareaRef.current.style.height = newHeight + 'px';
    }
  }, [input]);

  return (
    <form
      onSubmit={handleSubmit}
      className={styles.container}
    >
      <textarea
        ref={textareaRef}
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={isLoading ? "AI가 응답을 생성하고 있습니다..." : "메시지를 입력하세요... (Enter: 전송, Shift+Enter: 줄바꿈)"}
        className={styles.input}
        rows={1}
        disabled={isLoading}
      />
      <button
        type="submit"
        className={input.trim() && !isLoading ? `${styles.button} ${styles.buttonActive}` : styles.button}
        disabled={!input.trim() || isLoading}
        aria-label={isLoading ? "응답 대기 중" : "전송"}
      >
        {isLoading ? "⏳" : "→"}
      </button>
    </form>
  );
};

export default ChatInput;
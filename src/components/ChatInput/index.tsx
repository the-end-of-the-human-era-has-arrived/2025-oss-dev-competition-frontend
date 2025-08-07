import React, { useState, FormEvent, useRef, useEffect } from 'react';
import styles from './ChatInput.module.css';

type ChatInputProps = {
  onSend: (message: string) => void;
};

const ChatInput: React.FC<ChatInputProps> = ({ onSend }) => {
  const [input, setInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (input.trim() === '') return;
    onSend(input);
    setInput('');
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
        placeholder="메시지를 입력하세요..."
        className={styles.input}
        rows={1}
      />
      <button
        type="submit"
        className={input.trim() ? `${styles.button} ${styles.buttonActive}` : styles.button}
        disabled={!input.trim()}
        aria-label="전송"
      >
        →
      </button>
    </form>
  );
};

export default ChatInput;
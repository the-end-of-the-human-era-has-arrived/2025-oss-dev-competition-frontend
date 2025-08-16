import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import styles from './MarkdownRenderer.module.css';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, className }) => {
  return (
    <div className={`${styles.markdownContainer} ${className || ''}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
        components={{
          // 코드 블록 커스터마이징
          code: ({ node, className, children, ...props }: any) => {
            const match = /language-(\w+)/.exec(className || '');
            const language = match ? match[1] : '';
            
            // Check if it's inline code by checking if it's wrapped in a <p> tag
            if (!className?.startsWith('language-')) {
              return (
                <code className={styles.inlineCode} {...props}>
                  {children}
                </code>
              );
            }
            
            return (
              <div className={styles.codeBlockWrapper}>
                {language && (
                  <div className={styles.codeLanguage}>
                    {language}
                  </div>
                )}
                <pre className={styles.codeBlock}>
                  <code className={className} {...props}>
                    {children}
                  </code>
                </pre>
              </div>
            );
          },
          
          // 링크 커스터마이징
          a: ({ href, children, ...props }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.link}
              {...props}
            >
              {children}
            </a>
          ),
          
          // 테이블 커스터마이징
          table: ({ children, ...props }) => (
            <div className={styles.tableWrapper}>
              <table className={styles.table} {...props}>
                {children}
              </table>
            </div>
          ),
          
          // 헤딩 커스터마이징
          h1: ({ children, ...props }) => (
            <h1 className={styles.h1} {...props}>{children}</h1>
          ),
          h2: ({ children, ...props }) => (
            <h2 className={styles.h2} {...props}>{children}</h2>
          ),
          h3: ({ children, ...props }) => (
            <h3 className={styles.h3} {...props}>{children}</h3>
          ),
          
          // 리스트 커스터마이징
          ul: ({ children, ...props }) => (
            <ul className={styles.ul} {...props}>{children}</ul>
          ),
          ol: ({ children, ...props }) => (
            <ol className={styles.ol} {...props}>{children}</ol>
          ),
          li: ({ children, ...props }) => (
            <li className={styles.li} {...props}>{children}</li>
          ),
          
          // 인용구 커스터마이징
          blockquote: ({ children, ...props }) => (
            <blockquote className={styles.blockquote} {...props}>
              {children}
            </blockquote>
          ),
          
          // 문단 커스터마이징
          p: ({ children, ...props }) => (
            <p className={styles.paragraph} {...props}>{children}</p>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownRenderer;

// API 관련 상수
export const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001';

// 소셜 로그인 관련 상수
export const SOCIAL_LOGIN_CONFIG = {
  GOOGLE_CLIENT_ID: process.env.REACT_APP_GOOGLE_CLIENT_ID || '',
  GITHUB_CLIENT_ID: process.env.REACT_APP_GITHUB_CLIENT_ID || '',
  KAKAO_CLIENT_ID: process.env.REACT_APP_KAKAO_CLIENT_ID || '',
  NAVER_CLIENT_ID: process.env.REACT_APP_NAVER_CLIENT_ID || '',
};

// 애플리케이션 설정
export const APP_CONFIG = {
  NAME: 'Notion Agent',
  VERSION: '1.0.0',
  DESCRIPTION: 'AI 기반 마인드맵 생성 및 채팅 서비스',
};

// 마인드맵 설정
export const MINDMAP_CONFIG = {
  NODE_SIZE: 24,
  NODE_COLORS: ['#2e75cc', '#4caf50', '#ff9800', '#9c27b0', '#f44336'],
  EDGE_COLOR: '#e1e5e9',
  EDGE_WIDTH: 2,
}; 
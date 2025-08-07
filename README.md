# Notion Agent

AI 기반 마인드맵 생성 및 채팅 서비스

## 🚀 기능

- 🤖 AI 채팅 어시스턴트
- 🧠 마인드맵 시각화
- 💬 실시간 채팅 인터페이스
- 🔐 소셜 로그인 (Google, GitHub, Kakao, Naver)
- 📱 반응형 디자인

## 🏗️ 프로젝트 구조

```
src/
├── components/          # 재사용 가능한 컴포넌트
│   ├── ChatInput/      # 채팅 입력 컴포넌트
│   ├── ChatLog/        # 채팅 로그 컴포넌트
│   ├── MindMap/        # 마인드맵 컴포넌트
│   └── TopBar/         # 상단 바 컴포넌트
├── contexts/           # React Context
│   └── AuthContext.tsx # 인증 상태 관리
├── services/           # API 서비스
│   └── api.ts         # API 클라이언트
├── types/              # TypeScript 타입 정의
│   └── index.ts       # 공통 타입
├── utils/              # 유틸리티 함수
│   └── constants.ts   # 상수 정의
└── styles/             # 전역 스타일
```

## 🛠️ 기술 스택

- **Frontend**: React 18, TypeScript
- **상태 관리**: React Context + useReducer
- **스타일링**: CSS Modules
- **API**: Fetch API
- **인증**: 소셜 로그인 (OAuth 2.0)

## 📦 설치 및 실행

### 1. 저장소 클론
```bash
git clone https://github.com/your-username/2025-oss-dev-competition-frontend.git
cd 2025-oss-dev-competition-frontend
```

### 2. 의존성 설치
```bash
npm install
```

### 3. 환경변수 설정
`env.example` 파일을 참고하여 `.env` 파일을 생성하고 다음 내용을 추가하세요:

```env
# API 설정
REACT_APP_API_BASE_URL=http://localhost:3001

# 소셜 로그인 설정
REACT_APP_GOOGLE_CLIENT_ID=your_google_client_id
REACT_APP_GITHUB_CLIENT_ID=your_github_client_id
REACT_APP_KAKAO_CLIENT_ID=your_kakao_client_id
REACT_APP_NAVER_CLIENT_ID=your_naver_client_id
```

### 4. 개발 서버 실행
```bash
npm start
```

브라우저에서 [http://localhost:3000](http://localhost:3000)을 열어 애플리케이션을 확인하세요.

## 🔧 개발 가이드

### 컴포넌트 추가
1. `src/components/` 디렉토리에 새 폴더 생성
2. `index.tsx`와 `ComponentName.module.css` 파일 생성
3. 타입 정의는 `src/types/index.ts`에 추가

### API 추가
1. `src/services/api.ts`에 새로운 API 함수 추가
2. 타입 정의는 `src/types/index.ts`에 추가

### 소셜 로그인 추가
1. `src/utils/constants.ts`에 클라이언트 ID 추가
2. `src/contexts/AuthContext.tsx`에 로그인 로직 추가
3. `src/components/TopBar/`에 로그인 버튼 추가

## 🧪 테스트

```bash
# 테스트 실행
npm test

# 테스트 커버리지 확인
npm test -- --coverage
```

## 📦 빌드

```bash
# 프로덕션 빌드
npm run build

# 빌드 결과 확인
npm run build && serve -s build
```

## 🤝 협업 가이드

### 브랜치 전략
- `main`: 프로덕션 브랜치
- `develop`: 개발 브랜치
- `feature/기능명`: 기능 개발 브랜치
- `hotfix/버그명`: 긴급 수정 브랜치

### 커밋 메시지 규칙
```
feat: 새로운 기능 추가
fix: 버그 수정
docs: 문서 수정
style: 코드 포맷팅
refactor: 코드 리팩토링
test: 테스트 추가
chore: 빌드 설정 변경
```

### 코드 리뷰 체크리스트
- [ ] TypeScript 타입 정의 완료
- [ ] 컴포넌트 재사용성 고려
- [ ] 에러 처리 구현
- [ ] 반응형 디자인 적용
- [ ] 접근성 고려

## 📝 라이선스

이 프로젝트는 [MIT License](LICENSE) 하에 배포됩니다.

## 📄 파일 설명

- `env.example`: 환경변수 설정 예시 파일
- `LICENSE`: MIT 라이선스 파일
- `public/manifest.json`: PWA 매니페스트 설정
- `public/index.html`: 메인 HTML 템플릿

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.\
You will also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can't go back!**

If you aren't satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you're on your own.

You don't have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn't feel obligated to use this feature. However we understand that this tool wouldn't be useful if you couldn't customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

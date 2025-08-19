# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- `npm start` - Runs the development server on localhost:3000
- `npm test` - Launches test runner in interactive watch mode
- `npm run build` - Builds the app for production to the `build` folder
- `npm run eject` - Ejects from Create React App (one-way operation)

## Architecture Overview

This is a React TypeScript application built with Create React App, implementing a "Notion Agent" - an AI-powered mindmap generation and chat service that integrates with backend APIs for authentication and data management.

### Core Application Structure

**Main App Component (`src/App.tsx`)**
- Central state management using Zustand for authentication and local state for chat messages
- Controls the main layout switching between intro screen and authenticated interface
- Manages message flow between chat and AI responses via real API calls
- Handles initial authentication state checking via session cookies

**Layout Design**
- Fixed TopBar with logo and authentication controls
- Two-panel authenticated interface:
  - Left panel: Chat interface with message history and input
  - Right panel: Split between MindMap (2/3) and Sources (1/3) sections

### Key Components

**TopBar (`src/components/TopBar/`)**
- Real authentication system using Notion OAuth via backend
- Authentication API calls in `authApi.tsx` with proper session management
- Handles login redirect to `http://localhost:8080/auth/notion`
- Session status checking via HttpOnly cookies

**ChatLog (`src/components/ChatLog/`)**
- Message rendering for user and AI conversations with markdown support via react-markdown
- Welcome message when no conversations exist
- Clear conversation history functionality
- Exports `Message` type for application-wide use

**ChatInput (`src/components/ChatInput/`)**
- Auto-resizing textarea (max 120px height)
- Form submission handling with Enter key support
- Send button with loading states and visual feedback

**MindMap (`src/components/MindMap/`)**
- Interactive graph visualization with d3-force physics simulation
- Real-time API integration with `GET /api/users/{userId}/mindmap`
- Advanced zoom/pan controls with mouse wheel and drag support
- SVG-based edge rendering with positioned nodes
- Auto-centering and fit-to-view functionality with mathematical precision
- Conditional simulation stabilization and center alignment
- Node dragging with physics interaction

### State Management

**Zustand Store (`src/stores/authStore.ts`)**
- Global authentication state management
- User information storage with `id` and `name` fields
- Login/logout actions with proper state cleanup

### API Integration

**Backend Services**
- Authentication: `http://localhost:8080` (session-based with HttpOnly cookies)
- Chat API: `http://localhost:8081/api/chat` (real AI chat integration)
- MindMap API: `http://localhost:8080/api/users/{userId}/mindmap`
- Session status: `http://localhost:8080/api/session/status`

**Data Structures**
- Node interface: `{ id, notionPageId, keyword, x?, y? }`
- Edge interface: `{ source, target }` (d3-force compatible)
- API response transformation from `keyword1/keyword2` to `source/target`

**Error Handling**
- Comprehensive error handling with custom `ChatApiError` class
- Graceful fallbacks to dummy data when APIs are unavailable
- Timeout handling (30s for chat API)
- Network error recovery

### Styling Architecture

- CSS Modules used throughout (`*.module.css`)
- Component-specific styles in respective folders
- Global styles in `src/index.css` and `src/styles/common.module.css`
- Custom App-level styles in `App.module.css`

### Key Implementation Details

- TypeScript strict mode enabled
- React 19.1.1 with modern JSX transform
- d3-force physics simulation for interactive graph visualization
- Real-time DOM measurement for responsive container sizing
- Mathematical center alignment calculations for graph positioning
- Session-based authentication with HttpOnly cookie security
- Environment variable support for API base URLs (`REACT_APP_API_BASE_URL`)
- Proper cleanup of d3 simulations and event listeners
- ResizeObserver for responsive graph adjustments

### Dependencies

- **d3-force**: Physics-based graph layout and simulation
- **zustand**: Lightweight state management
- **react-markdown**: Markdown rendering for chat messages
- **react-icons**: Icon components
- **rehype-highlight**: Syntax highlighting for code blocks
- **remark-gfm**: GitHub Flavored Markdown support
# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AI-powered travel planning web application that generates personalized travel itineraries with map visualization, budget analysis, and visual imagery. The system supports multi-modal input (voice + text) and provides cloud-synced user accounts.

**Current Status**: Early setup phase - folder structure planned but not yet created. No source code implemented.

## Technology Stack

### Frontend
- **React with Vite**: Modern UI framework for building the interactive travel planning interface
- **Amap (高德地图) API**: Map visualization and route planning (preferred for accurate China data)
- **Web Speech API**: Browser-native voice-to-text recognition (no API key needed)

### Backend
- **Node.js + Express**: Lightweight API server for orchestrating business logic
- **Aliyun 百炼 (Bailian)**: LLM API for AI-powered itinerary generation (instructor has key)

### Database & Auth
- **Supabase**: All-in-one solution providing PostgreSQL database, authentication, and cloud storage
- Row Level Security (RLS) policies enforce user data isolation
- JWT-based authentication with built-in email verification

## Critical Requirements

### Docker Deployment (Mandatory)
The entire application MUST be containerized with a `docker-compose.yml` file that enables one-command startup:
```bash
docker-compose up --build
```

This is a **core deliverable requirement** for the project.

### Security - No Hardcoded Keys
All API keys and secrets MUST be managed via environment variables in `.env` files. Never commit secrets to the repository.

Required environment variables:
```bash
# Backend .env
SUPABASE_URL=https://[project-id].supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
ALIYUN_API_KEY=your-key
AMAP_API_KEY=your-key
NODE_ENV=development
PORT=5000
```

## Architecture

### Project Structure (Planned)
```
travel-ai/
├── frontend/              # React + Vite application
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── pages/         # Page-level components
│   │   ├── services/      # API client integrations
│   │   └── App.tsx
│   ├── Dockerfile
│   └── package.json
├── backend/               # Node.js + Express API
│   ├── src/
│   │   ├── routes/        # Express route handlers
│   │   ├── controllers/   # Business logic
│   │   ├── services/      # External API integrations
│   │   └── middleware/    # Auth, validation, error handling
│   ├── Dockerfile
│   └── package.json
├── docker-compose.yml     # Multi-container orchestration (REQUIRED)
└── .env.example          # Template for environment variables
```

### Data Models

**Users**: Standard user accounts with authentication and preferences
**Trips**: Travel plans including destination, dates, budget, traveler count, and AI-generated itinerary
**Expenses**: Budget tracking for actual spending during trips
**Trip_Preferences**: User's travel style preferences (cuisine, activities, accommodation types)

### API Endpoints Structure

Authentication (Supabase):
- `POST /auth/signup`, `/auth/login`, `/auth/logout`

Trip Management:
- `POST /api/trips` - Create trip with user requirements
- `GET /api/trips` - List user's trips
- `GET /api/trips/:id` - Get trip details
- `POST /api/trips/:id/generate` - Generate AI itinerary

Budget Tracking:
- `GET /api/trips/:id/budget` - Get budget summary
- `POST /api/trips/:id/expenses` - Add expense
- `GET /api/trips/:id/expenses` - List expenses

Map Data:
- `GET /api/trips/:id/map-data` - Get location markers
- `GET /api/trips/:id/routes` - Get daily route information

## Request Flow

### Creating a Trip with AI Itinerary
1. User provides input (voice via Web Speech API or text form) with destination, dates, budget, traveler count, preferences
2. Frontend sends `POST /api/trips` with requirements
3. Backend validates JWT token and extracts user context
4. Trip service calls Aliyun 百炼 API to generate detailed itinerary
5. Amap API enriches locations with coordinates for map markers
6. Trip data stored in Supabase with generated itinerary
7. Frontend receives response and renders itinerary with map visualization

### Authentication Flow
1. User registers/logs in via Supabase Auth
2. Email verification sent
3. JWT access token returned and stored in frontend (localStorage or httpOnly cookie)
4. All protected API requests include token in `Authorization: Bearer <token>` header
5. Backend middleware validates token using Supabase's public key
6. Database RLS policies enforce user-specific data access

## Development Setup

### Initial Setup (Not Yet Implemented)
When starting development, the following must be created:

1. Initialize frontend:
```bash
npm create vite@latest frontend -- --template react-ts
cd frontend && npm install
```

2. Initialize backend:
```bash
mkdir backend && cd backend
npm init -y
npm install express cors dotenv
npm install -D typescript @types/node @types/express ts-node nodemon
```

3. Create `docker-compose.yml` with services for frontend and backend

4. Set up Supabase project and configure database migrations with RLS policies

### Development Commands (Expected)

Frontend:
```bash
npm run dev        # Start Vite dev server
npm run build      # Production build
npm run preview    # Preview production build
```

Backend:
```bash
npm run dev        # Start with hot reload
npm start          # Production server
```

Docker:
```bash
docker-compose up --build    # Build and start all services
docker-compose logs -f       # View logs
docker-compose down          # Stop services
```

## Key Architectural Decisions

- **React + Vite**: Fast development with rich ecosystem for complex UI (maps, forms, charts)
- **Node.js + Express**: Lightweight API layer with JavaScript/TypeScript across full stack
- **Supabase**: Accelerates development with integrated database, auth, and storage
- **Aliyun 百炼**: Instructor has API key, simplifies key management for course project
- **Amap API**: Superior accuracy for China locations, comprehensive JavaScript SDK
- **Web Speech API**: Browser-native voice input eliminates external API key management
- **Docker Compose**: Satisfies one-command startup requirement for easy deployment

## Security Considerations

1. **JWT Validation**: All protected endpoints must validate tokens
2. **RLS Policies**: Database-level enforcement of user data isolation
3. **Input Validation**: Sanitize all user inputs before processing
4. **CORS Configuration**: Only allow requests from frontend origin
5. **Environment Variables**: All secrets in .env files, never hardcoded
6. **HTTPS Only**: Production must use HTTPS
7. **Rate Limiting**: Protect APIs from abuse

## Core Features Implementation Notes

### Multi-Modal Input
- Voice input is **mandatory**: Use Web Speech API for voice-to-text
- Text input via standard forms
- Both input methods should pre-fill the same trip creation form

### Map Visualization
- Display trip locations as markers on Amap
- Draw suggested daily routes between locations
- Interactive map with zoom, pan, and location details

### Budget Management
- AI provides initial budget estimate during itinerary generation
- User can log actual expenses during trip
- Display budget vs. actual spending analytics with charts

### Visual Presentation
- Include relevant images for destinations and attractions
- Use attractive UI components for itinerary display
- Responsive design for mobile and desktop

## Language & Communication

This is a Chinese university course project (大模型辅助软件工程作业). Documentation and comments may be in Chinese, but code should follow English naming conventions for technical terms and variables.

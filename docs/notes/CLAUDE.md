# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a full-stack video reporting system ("Sistema de Relatórios de Vídeos") built for managing video uploads, tracking monthly production limits, and generating professional reports. The application enforces a monthly limit of 1,100 seconds with rollover capabilities from the previous 2 months.

## Architecture

- **Backend**: Node.js/Express with TypeScript, Sequelize ORM, MySQL database
- **Frontend**: React 18 with TypeScript, Tailwind CSS, React Router v6
- **Authentication**: JWT-based with bcryptjs password hashing
- **File Storage**: Local uploads (prepared for cloud storage migration)
- **PDF Generation**: Puppeteer for professional report generation
- **Containerization**: Docker with multiple environments (dev, production, swarm)

## Key Development Commands

### Installation and Setup
```bash
# Install all dependencies (root, backend, frontend)
npm run install:all

# Start development environment with Docker (recommended)
docker-compose up -d
# OR use convenience scripts
./start-local.sh

# Stop development environment
./stop-local.sh
docker-compose down
```

### Development Servers
```bash
# Run both backend and frontend concurrently
npm run dev

# Run individual services
npm run dev:backend    # Backend only
npm run dev:frontend   # Frontend only
cd backend && npm run dev:debug  # Backend with debug mode
```

### Building and Testing
```bash
# Build for production
npm run build

# Run all tests
npm run test

# Backend-specific operations
cd backend && npm run migrate  # Database migrations
cd backend && npm run seed     # Seed initial data
```

### Docker Operations
```bash
# View logs
docker-compose logs -f
docker-compose logs -f backend
docker-compose logs -f frontend

# Production deployment (Docker Swarm)
npm run docker:swarm
docker stack deploy -c docker-compose.swarm.yml relatorio
```

## Project Structure

### Backend (`/backend`)
- `src/models/` - Sequelize database models (User, Video)
- `src/routes/` - Express API routes
- `src/middleware/` - Authentication, file upload, rate limiting
- `src/utils/` - PDF generation, utilities
- `src/database/` - Database configuration and migrations
- `uploads/` - Video file storage directory

### Frontend (`/frontend`)
- `src/components/` - Reusable React components
- `src/pages/` - Page-level components
- `src/contexts/` - React contexts (AuthContext for JWT management)
- `src/utils/` - API utilities, formatters

## Key Business Logic

### Video Duration Calculation
- Additional versions count as 50% of original duration
- Example: 30s video + additional version = 45s total

### Monthly Limits
- Base limit: 1,100 seconds per month
- Rollover: Unused seconds from previous 2 months carry forward
- Reports group videos by editor and show total usage

### File Upload Constraints
- Formats: MP4, MOV only
- Size limit: 500MB maximum
- Validation occurs at both frontend and backend

## Environment Configuration

### Required Environment Variables
- `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` - MySQL connection
- `JWT_SECRET` - JWT token signing key
- `NODE_ENV` - Environment (development/production)
- `FRONTEND_URL` - CORS configuration
- `REACT_APP_API_URL` - Frontend API endpoint

## Testing and Quality

- Backend uses Jest with ts-jest for TypeScript testing
- Frontend uses React Testing Library
- SonarQube integration for code quality analysis
- GitHub Actions CI/CD pipeline with automated testing

## Security Features

- JWT authentication with secure token handling
- bcryptjs password hashing
- Express rate limiting
- File type and size validation
- CORS protection
- Input validation and sanitization

## Video Processing Features

### Automatic MOV to MP4 Conversion
- **VideoProcessor Class**: Located in `backend/src/utils/videoProcessor.ts`
- **Automatic Detection**: MOV files are automatically detected during upload
- **Preview Creation**: Compressed MP4 previews are generated for web viewing
- **FFmpeg Integration**: Uses FFmpeg in Docker container for video processing
- **Error Handling**: Upload continues even if conversion fails
- **Storage**: Previews stored in `uploads/previews/` directory

### Preview System
- **Endpoint**: `GET /api/videos/:id/preview` - Returns preview URL
- **Fallback**: Uses original file if preview creation fails
- **Compression**: Medium quality (720p, CRF 23) for optimal web viewing
- **Static Serving**: Previews accessible via `/previews/` route

## Reports Interface

### Dynamic Report Generation
- **Monthly Navigation**: Arrow buttons for month-to-month navigation
- **Auto-loading**: Reports load automatically when page opens or month changes
- **Compact Grid**: Videos displayed in organized grid layout grouped by editor
- **Real-time Statistics**: Usage cards showing totals, limits, and remaining time
- **Date Filtering**: Uses `requestDate` field for accurate monthly grouping

### Report Features
- **PDF Export**: Professional PDF generation with customizable fields
- **Editor Grouping**: Videos automatically grouped by assigned editor
- **Monthly Limits**: Displays usage against 1,100-second monthly limit
- **Duration Calculation**: Includes additional versions (50% of original duration)

## Development Notes

- The application is containerized with multiple Docker Compose configurations for different environments
- Database migrations should be run when schema changes occur
- PDF generation uses Puppeteer and requires Chrome/Chromium in the container
- Video files are stored locally but the architecture supports future cloud storage integration
- All API endpoints require authentication except registration and login
- FFmpeg is included in the Docker container for video processing capabilities
- Reports use `requestDate` instead of `createdAt` for accurate monthly categorization
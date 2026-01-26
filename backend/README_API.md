# GameVault Backend

RESTful API for the GameVault game management and preservation platform.

## Quick Start

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Start development server
npm run dev
```

## Prerequisites

- Node.js 18+
- PostgreSQL 15+
- npm or yarn

## Environment Variables

Create a `.env` file in the backend directory:

```env
PORT=3000
NODE_ENV=development
DB_HOST=localhost
DB_PORT=5432
DB_NAME=gamevault
DB_USER=postgres
DB_PASSWORD=your_password
JWT_SECRET=your_secret_key
JWT_EXPIRES_IN=7d
CORS_ORIGIN=http://localhost:3001
```

## Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint

## API Documentation

### Base URL
```
http://localhost:3000/api
```

### Authentication Endpoints

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securePassword123"
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "securePassword123"
}
```

#### Get Current User
```http
GET /api/auth/me
Authorization: Bearer <token>
```

### Game Endpoints

#### Get All Games
```http
GET /api/games?page=1&limit=20&search=zelda&release_status=released
```

#### Get Game by ID
```http
GET /api/games/:id
```

#### Create Game (Admin only)
```http
POST /api/games
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "title": "Game Title",
  "slug": "game-title",
  "description": "Game description",
  "release_status": "released",
  "availability_status": "available"
}
```

#### Update Game (Admin only)
```http
PUT /api/games/:id
Authorization: Bearer <admin_token>
```

#### Delete Game (Admin only)
```http
DELETE /api/games/:id
Authorization: Bearer <admin_token>
```

### Platform Endpoints

#### Get All Platforms
```http
GET /api/platforms
```

#### Get Platform by ID
```http
GET /api/platforms/:id
```

#### Create Platform (Admin only)
```http
POST /api/platforms
Authorization: Bearer <admin_token>
```

### User Endpoints

#### Get Profile
```http
GET /api/users/profile
Authorization: Bearer <token>
```

#### Update Profile
```http
PUT /api/users/profile
Authorization: Bearer <token>
```

## Database Schema

The backend uses Sequelize ORM with PostgreSQL. Main models:

- **User** - User accounts and authentication
- **Game** - Game information and metadata
- **Platform** - Gaming platforms (PS5, Xbox, PC, etc.)
- **Genre** - Game genres
- **Developer** - Game developers
- **Publisher** - Game publishers

## Architecture

```
backend/
├── src/
│   ├── config/          # Configuration files
│   │   ├── app.ts       # App configuration
│   │   └── database.ts  # Database connection
│   ├── controllers/     # Request handlers
│   ├── middlewares/     # Express middlewares
│   ├── models/          # Sequelize models
│   ├── routes/          # API routes
│   └── index.ts         # Application entry point
├── .env                 # Environment variables
└── package.json
```

## Error Handling

All endpoints return responses in the following format:

**Success Response:**
```json
{
  "success": true,
  "message": "Operation completed",
  "data": { ... }
}
```

**Error Response:**
```json
{
  "success": false,
  "message": "Error description",
  "errors": [ ... ]
}
```

## Authentication

The API uses JWT (JSON Web Tokens) for authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your_token>
```

## Rate Limiting

API endpoints are rate-limited to prevent abuse:
- 100 requests per 15 minutes per IP address

## CORS

CORS is configured to accept requests from the frontend origin specified in `CORS_ORIGIN` environment variable.

## Development

### Running Tests
```bash
npm test
```

### Linting
```bash
npm run lint
```

### Database Migration
```bash
# The database will sync automatically in development mode
# For production, use migrations
```

## Production Deployment

1. Build the application:
```bash
npm run build
```

2. Set production environment variables

3. Start the server:
```bash
npm start
```

## Security Features

- Password hashing with bcrypt
- JWT authentication
- Helmet.js for security headers
- Rate limiting
- Input validation
- CORS protection

## License

MIT

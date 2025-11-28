# GameVault Backend

REST API for the GameVault - Game Management and Preservation Platform.

## Technology Stack

- **Runtime:** Node.js
- **Framework:** Express.js
- **Language:** TypeScript
- **Database:** PostgreSQL
- **ORM:** Sequelize
- **Authentication:** JWT (JSON Web Tokens)

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- PostgreSQL (v13 or higher)
- npm or yarn

### Installation

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create environment file:
```bash
cp .env.example .env
```

4. Configure your `.env` file with your database credentials and JWT secret.

5. Start the development server:
```bash
npm run dev
```

## Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build TypeScript to JavaScript
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npm test` - Run tests

## API Endpoints

### Authentication
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | `/api/auth/register` | Register new user | Public |
| POST | `/api/auth/login` | User login | Public |
| POST | `/api/auth/logout` | User logout | Public |
| GET | `/api/auth/me` | Get current user | Private |

### Users
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/api/users` | Get all users | Admin |
| GET | `/api/users/:id` | Get user by ID | Private |
| PUT | `/api/users/me` | Update profile | Private |
| DELETE | `/api/users/:id` | Delete user | Admin |

### Games
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/api/games` | Get all games | Public |
| GET | `/api/games/:id` | Get game by ID | Public |
| GET | `/api/games/search` | Search games | Public |
| GET | `/api/games/upcoming-releases` | Get upcoming releases | Public |
| GET | `/api/games/abandonware` | Get abandonware games | Public |
| POST | `/api/games` | Create game | Admin |
| PUT | `/api/games/:id` | Update game | Admin |
| DELETE | `/api/games/:id` | Delete game | Admin |

### Platforms
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/api/platforms` | Get all platforms | Public |
| GET | `/api/platforms/:id` | Get platform by ID | Public |
| POST | `/api/platforms` | Create platform | Admin |
| PUT | `/api/platforms/:id` | Update platform | Admin |
| DELETE | `/api/platforms/:id` | Delete platform | Admin |

### Health Check
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/api/health` | API health check | Public |

## Project Structure

```
backend/
├── src/
│   ├── config/          # Configuration files (database, app settings)
│   ├── controllers/     # Request handlers
│   ├── middlewares/     # Custom middleware (auth, error handling)
│   ├── models/          # Sequelize models
│   ├── routes/          # API route definitions
│   ├── services/        # Business logic
│   ├── utils/           # Helper functions
│   ├── validators/      # Request validation
│   └── index.ts         # Application entry point
├── .env.example         # Environment variables template
├── package.json         # Project dependencies
├── tsconfig.json        # TypeScript configuration
└── README.md            # This file
```

## Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `PORT` | Server port | `3000` |
| `NODE_ENV` | Environment | `development` |
| `DB_HOST` | Database host | `localhost` |
| `DB_PORT` | Database port | `5432` |
| `DB_NAME` | Database name | `gamevault` |
| `DB_USER` | Database user | `postgres` |
| `DB_PASSWORD` | Database password | `yourpassword` |
| `JWT_SECRET` | JWT secret key | `your-secret-key` |
| `JWT_EXPIRES_IN` | Token expiration | `7d` |
| `CORS_ORIGIN` | Allowed CORS origin | `http://localhost:3001` |
| `RAWG_API_KEY` | RAWG API key | `your-api-key` |

## Authentication

The API uses JWT (JSON Web Tokens) for authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-token>
```

## Error Responses

All error responses follow this format:

```json
{
  "success": false,
  "message": "Error description"
}
```

## Success Responses

All success responses follow this format:

```json
{
  "success": true,
  "message": "Success message (optional)",
  "data": { ... }
}
```

## License

MIT

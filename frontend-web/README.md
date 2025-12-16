# GameVault Frontend

React web application for the GameVault platform.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file:
```bash
cp .env.example .env
```

3. Update API URL in `.env` if needed

4. Start development server:
```bash
npm start
```

The app will open at http://localhost:3001

## Available Scripts

- `npm start` - Start development server (port 3001)
- `npm build` - Build for production
- `npm test` - Run tests
- `npm run lint` - Run ESLint

## Project Structure

```
src/
├── components/     # Reusable React components
│   ├── common/     # Common UI components
│   ├── layout/     # Layout components
│   └── games/      # Game-specific components
├── pages/          # Page components
├── contexts/       # React Context providers
├── hooks/          # Custom React hooks
├── services/       # API services
├── types/          # TypeScript types
├── utils/          # Utility functions
└── styles/         # Global styles
```

## Key Features

- ✅ TypeScript for type safety
- ✅ Tailwind CSS for styling
- ✅ React Router v6 for navigation
- ✅ Axios with interceptors
- ✅ Context API for state management
- ✅ Protected routes
- ✅ Responsive design
- ✅ Form validation

## API Integration

The frontend connects to the backend API at `http://localhost:3000/api`

Make sure the backend is running before starting the frontend.

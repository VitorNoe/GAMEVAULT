# GameVault Frontend Web - Setup Guide

## Project Structure Created

```
frontend-web/
├── public/
│   ├── favicon.ico
│   └── index.html
├── src/
│   ├── assets/
│   │   ├── images/
│   │   └── icons/
│   ├── components/
│   │   ├── common/
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Badge.tsx
│   │   │   ├── Loading.tsx
│   │   │   └── ErrorMessage.tsx
│   │   ├── layout/
│   │   │   ├── Header.tsx
│   │   │   ├── Footer.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   └── Layout.tsx
│   │   └── games/
│   │       ├── GameCard.tsx
│   │       ├── GameGrid.tsx
│   │       ├── GameFilters.tsx
│   │       └── GameDetails.tsx
│   ├── pages/
│   │   ├── Home.tsx
│   │   ├── Login.tsx
│   │   ├── Register.tsx
│   │   ├── Games.tsx
│   │   ├── GameDetails.tsx
│   │   ├── Collection.tsx
│   │   ├── Wishlist.tsx
│   │   ├── Profile.tsx
│   │   ├── Settings.tsx
│   │   └── Admin.tsx
│   ├── contexts/
│   │   ├── AuthContext.tsx
│   │   └── ThemeContext.tsx
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useGames.ts
│   │   └── useApi.ts
│   ├── services/
│   │   ├── api.ts
│   │   ├── authService.ts
│   │   └── gameService.ts
│   ├── utils/
│   │   ├── constants.ts
│   │   ├── helpers.ts
│   │   └── validators.ts
│   ├── types/
│   │   ├── user.types.ts
│   │   ├── game.types.ts
│   │   └── api.types.ts
│   ├── styles/
│   │   ├── globals.css
│   │   └── tailwind.css
│   ├── App.tsx
│   ├── index.tsx
│   └── routes.tsx
├── .env.example
├── .gitignore
├── package.json
├── tsconfig.json
├── tailwind.config.js
├── postcss.config.js
└── README.md
```

## Quick Setup Commands

### 1. Create React App with TypeScript
```bash
cd frontend-web
npx create-react-app . --template typescript
```

### 2. Install Dependencies
```bash
npm install react-router-dom axios
npm install -D tailwindcss postcss autoprefixer
npm install @types/react-router-dom
```

### 3. Initialize Tailwind CSS
```bash
npx tailwindcss init -p
```

### 4. Create Directory Structure
```bash
# Create all directories
mkdir -p src/{assets/{images,icons},components/{common,layout,games},pages,contexts,hooks,services,utils,types,styles}
```

## Key Files to Create

### 1. Environment Variables (.env.example)
```env
REACT_APP_API_URL=http://localhost:3000/api
REACT_APP_NAME=GameVault
```

### 2. Tailwind Configuration (tailwind.config.js)
```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
        },
      },
    },
  },
  plugins: [],
}
```

### 3. Global Styles (src/styles/globals.css)
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  body {
    @apply bg-gray-50 text-gray-900;
  }
}

@layer components {
  .btn-primary {
    @apply bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors;
  }
  
  .card {
    @apply bg-white rounded-lg shadow-md p-6;
  }
}
```

### 4. TypeScript Configuration (tsconfig.json)
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "jsx": "react-jsx",
    "module": "ESNext",
    "moduleResolution": "node",
    "resolveJsonModule": true,
    "allowJs": true,
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "allowSyntheticDefaultImports": true,
    "noFallthroughCasesInSwitch": true,
    "isolatedModules": true,
    "noEmit": true,
    "baseUrl": "src",
    "paths": {
      "@/*": ["*"],
      "@/components/*": ["components/*"],
      "@/pages/*": ["pages/*"],
      "@/hooks/*": ["hooks/*"],
      "@/services/*": ["services/*"],
      "@/utils/*": ["utils/*"],
      "@/types/*": ["types/*"]
    }
  },
  "include": ["src"],
  "exclude": ["node_modules"]
}
```

## Next Steps

1. **Copy the code files** I'll provide in the next artifacts
2. **Install dependencies**: `npm install`
3. **Start development server**: `npm start`
4. **Build for production**: `npm run build`

## Development Workflow

1. Start backend API (port 3000)
2. Start frontend dev server (port 3001)
3. Create `.env` file based on `.env.example`
4. Test authentication flow
5. Implement additional features

## Important Notes

- All components use TypeScript for type safety
- Tailwind CSS for styling (no custom CSS needed)
- Axios for API calls with interceptors
- React Router v6 for navigation
- Context API for global state (Auth, Theme)
- Responsive design by default
- Ready for GitHub Codespaces

## Ports

- **Backend API**: http://localhost:3000
- **Frontend Web**: http://localhost:3001
- **Database**: localhost:5432

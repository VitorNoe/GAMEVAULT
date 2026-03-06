import { ReleaseStatus, AvailabilityStatus } from '../types/game.types';

// Detect the correct API base URL at runtime
export const getApiBaseUrl = (): string => {
  if (typeof window !== 'undefined') {
    const { hostname, port } = window.location;

    // Running behind nginx (Docker) – nginx proxies /api/ to backend
    // Covers both local Docker (localhost:80) and Codespaces (*.app.github.dev on port 80)
    if (!port || port === '80' || port === '443') {
      return '/api';
    }

    // Codespaces dev server (port 3001) – reach backend on port 3000
    if (hostname.includes('app.github.dev')) {
      const backendHost = hostname.replace(/-\d+\./, '-3000.');
      return `https://${backendHost}/api`;
    }
  }
  // Fallback: dev server pointing at local backend
  return process.env.REACT_APP_API_URL || 'http://localhost:3000/api';
};

// For compatibility, we keep API_BASE_URL but it will be overridden at runtime
export let API_BASE_URL = '/api';

// Initialize at runtime when the module is loaded in the browser
if (typeof window !== 'undefined') {
  API_BASE_URL = getApiBaseUrl();
}

export const APP_NAME = process.env.REACT_APP_NAME || 'GameVault';

export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  GAMES: '/games',
  GAME_DETAILS: '/games/:id',
  COLLECTION: '/collection',
  WISHLIST: '/wishlist',
  PLAYING: '/playing',
  COMPLETED: '/completed',
  GOTY_AWARDS: '/awards',
  UPCOMING: '/upcoming',
  ABANDONWARE: '/abandonware',
  PROFILE: '/profile',
  SETTINGS: '/settings',
  ADMIN: '/admin',
} as const;

export const RELEASE_STATUS_LABELS: Record<ReleaseStatus, string> = {
  released: 'Released',
  early_access: 'Early Access',
  open_beta: 'Open Beta',
  closed_beta: 'Closed Beta',
  alpha: 'Alpha',
  coming_soon: 'Coming Soon',
  in_development: 'In Development',
  cancelled: 'Cancelled',
};

export const AVAILABILITY_STATUS_LABELS: Record<AvailabilityStatus, string> = {
  available: 'Available',
  out_of_catalog: 'Out of Catalog',
  expired_license: 'Expired License',
  abandonware: 'Abandonware',
  public_domain: 'Public Domain',
  discontinued: 'Discontinued',
  rereleased: 'Re-released',
};

import { ReleaseStatus, AvailabilityStatus } from '../types/game.types';

// Detectar se estamos no Codespaces ou local - executado em runtime
export const getApiBaseUrl = (): string => {
  if (typeof window !== 'undefined' && window.location.hostname.includes('app.github.dev')) {
    // Codespaces - usar a URL do backend no Codespace
    const hostname = window.location.hostname;
    const backendHost = hostname.replace('-3001.', '-3000.');
    return `https://${backendHost}/api`;
  }
  return process.env.REACT_APP_API_URL || 'http://localhost:3000/api';
};

// Para compatibilidade, mantemos API_BASE_URL mas será sobrescrito em runtime
export let API_BASE_URL = 'http://localhost:3000/api';

// Inicializar em runtime quando o módulo for carregado no browser
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

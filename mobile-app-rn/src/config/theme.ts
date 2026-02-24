export const theme = {
  colors: {
    primary: '#6366F1',
    primaryLight: '#818CF8',
    primaryDark: '#4F46E5',
    secondary: '#8B5CF6',
    accent: '#EC4899',
    accentCyan: '#22D3EE',

    background: '#0A0E1A',
    surface: '#111827',
    card: '#1E293B',
    cardLight: '#273549',
    border: '#374151',

    text: '#F9FAFB',
    textSecondary: '#9CA3AF',
    textMuted: '#6B7280',
    textInverse: '#111827',

    success: '#22C55E',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6',

    metacriticGreen: '#66CC33',
    metacriticYellow: '#FFCC33',
    metacriticRed: '#FF0000',

    white: '#FFFFFF',
    black: '#000000',
    transparent: 'transparent',
  },

  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    xxxl: 32,
  },

  borderRadius: {
    sm: 6,
    md: 10,
    lg: 14,
    xl: 20,
    full: 9999,
  },

  fontSize: {
    xs: 10,
    sm: 12,
    md: 14,
    lg: 16,
    xl: 18,
    xxl: 22,
    xxxl: 28,
    hero: 34,
  },

  fontWeight: {
    normal: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
    extrabold: '800' as const,
  },

  shadow: {
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.2,
      shadowRadius: 2,
      elevation: 2,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 4,
      elevation: 4,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.4,
      shadowRadius: 8,
      elevation: 8,
    },
  },
} as const;

export const metacriticColor = (score: number): string => {
  if (score >= 75) return theme.colors.metacriticGreen;
  if (score >= 50) return theme.colors.metacriticYellow;
  return theme.colors.metacriticRed;
};

export const releaseStatusColor = (status: string): string => {
  const map: Record<string, string> = {
    released: theme.colors.success,
    early_access: theme.colors.warning,
    coming_soon: theme.colors.info,
    in_development: theme.colors.accentCyan,
    cancelled: theme.colors.error,
    open_beta: theme.colors.secondary,
    closed_beta: theme.colors.primaryLight,
    alpha: theme.colors.accent,
  };
  return map[status] || theme.colors.textMuted;
};

export type Theme = typeof theme;

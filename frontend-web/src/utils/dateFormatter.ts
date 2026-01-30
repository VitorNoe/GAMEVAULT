/**
 * Date formatting utilities
 */

/**
 * Format date to locale string
 */
export const formatDate = (
    date: string | Date | null | undefined,
    locale = 'pt-BR',
    options: Intl.DateTimeFormatOptions = {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    }
): string => {
    if (!date) return 'N/A';

    try {
        const dateObj = typeof date === 'string' ? new Date(date) : date;
        return dateObj.toLocaleDateString(locale, options);
    } catch {
        return 'Invalid date';
    }
};

/**
 * Format date to short format (DD/MM/YYYY)
 */
export const formatShortDate = (date: string | Date | null | undefined): string => {
    if (!date) return 'N/A';

    try {
        const dateObj = typeof date === 'string' ? new Date(date) : date;
        return dateObj.toLocaleDateString('pt-BR');
    } catch {
        return 'Invalid date';
    }
};

/**
 * Format date to relative time (e.g., "2 hours ago")
 */
export const formatRelativeTime = (date: string | Date | null | undefined): string => {
    if (!date) return 'N/A';

    try {
        const dateObj = typeof date === 'string' ? new Date(date) : date;
        const now = new Date();
        const diffMs = now.getTime() - dateObj.getTime();
        const diffSecs = Math.floor(diffMs / 1000);
        const diffMins = Math.floor(diffSecs / 60);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);
        const diffMonths = Math.floor(diffDays / 30);
        const diffYears = Math.floor(diffDays / 365);

        if (diffYears > 0) return `${diffYears} ano${diffYears > 1 ? 's' : ''} atrás`;
        if (diffMonths > 0) return `${diffMonths} mês${diffMonths > 1 ? 'es' : ''} atrás`;
        if (diffDays > 0) return `${diffDays} dia${diffDays > 1 ? 's' : ''} atrás`;
        if (diffHours > 0) return `${diffHours} hora${diffHours > 1 ? 's' : ''} atrás`;
        if (diffMins > 0) return `${diffMins} minuto${diffMins > 1 ? 's' : ''} atrás`;
        return 'Agora';
    } catch {
        return 'Invalid date';
    }
};

/**
 * Get year from date
 */
export const getYear = (date: string | Date | null | undefined): number | null => {
    if (!date) return null;

    try {
        const dateObj = typeof date === 'string' ? new Date(date) : date;
        return dateObj.getFullYear();
    } catch {
        return null;
    }
};

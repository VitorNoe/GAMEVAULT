/**
 * Image utilities for handling fallbacks and placeholders
 */

// Default placeholder images
export const PLACEHOLDER_IMAGES = {
    game: '/placeholder-game.jpg',
    avatar: '/placeholder-avatar.png',
    banner: '/placeholder-banner.jpg',
    platform: '/placeholder-platform.png'
} as const;

// Generate placeholder URL with dimensions
export const getPlaceholderUrl = (
    width: number,
    height: number,
    text = 'No Image'
): string => {
    return `https://via.placeholder.com/${width}x${height}?text=${encodeURIComponent(text)}`;
};

/**
 * Handle image error by setting fallback
 */
export const handleImageError = (
    event: React.SyntheticEvent<HTMLImageElement>,
    fallbackSrc?: string,
    width = 300,
    height = 400
): void => {
    const target = event.currentTarget;

    // Prevent infinite loop if fallback also fails
    if (target.dataset.fallbackApplied) {
        return;
    }

    target.dataset.fallbackApplied = 'true';
    target.src = fallbackSrc || getPlaceholderUrl(width, height, 'Game');
};

/**
 * Create image error handler with custom fallback
 */
export const createImageErrorHandler = (
    fallbackSrc?: string,
    width = 300,
    height = 400
) => (event: React.SyntheticEvent<HTMLImageElement>): void => {
    handleImageError(event, fallbackSrc, width, height);
};

/**
 * Get optimized image URL (for future CDN integration)
 */
export const getOptimizedImageUrl = (
    url: string | null | undefined,
    options: {
        width?: number;
        quality?: number;
        format?: 'webp' | 'jpg' | 'png';
    } = {}
): string => {
    if (!url) return getPlaceholderUrl(options.width || 300, 400, 'Game');

    // For now, just return the original URL
    // In the future, this can integrate with an image CDN
    return url;
};

/**
 * Preload an image
 */
export const preloadImage = (src: string): Promise<void> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve();
        img.onerror = reject;
        img.src = src;
    });
};

/**
 * Check if URL is valid image
 */
export const isValidImageUrl = (url: string | null | undefined): boolean => {
    if (!url) return false;

    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
    const lowerUrl = url.toLowerCase();

    return imageExtensions.some(ext => lowerUrl.includes(ext)) ||
        url.startsWith('data:image/') ||
        url.includes('placeholder');
};

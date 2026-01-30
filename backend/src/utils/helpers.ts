import { Request } from 'express';

/**
 * Pagination helper - extracts and validates pagination parameters
 */
export interface PaginationParams {
    page: number;
    limit: number;
    offset: number;
}

export interface PaginationResult {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export const getPaginationParams = (req: Request, defaultLimit = 20): PaginationParams => {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || defaultLimit));
    const offset = (page - 1) * limit;

    return { page, limit, offset };
};

export const getPaginationResult = (
    total: number,
    page: number,
    limit: number
): PaginationResult => ({
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit)
});

/**
 * ID validation helper
 */
export const isValidId = (id: string | undefined): boolean => {
    if (!id) return false;
    const numId = parseInt(id);
    return !isNaN(numId) && numId > 0;
};

export const parseId = (id: string): number | null => {
    const numId = parseInt(id);
    return !isNaN(numId) && numId > 0 ? numId : null;
};

/**
 * Search query sanitization
 */
export const sanitizeSearchQuery = (query: string | undefined): string => {
    if (!query || typeof query !== 'string') return '';
    // Remove special SQL characters and limit length
    return query
        .replace(/[%_\\]/g, '\\$&')
        .trim()
        .substring(0, 100);
};

/**
 * Response helpers
 */
export interface ApiResponse<T = unknown> {
    success: boolean;
    message?: string;
    data?: T;
    errors?: unknown[];
}

export const successResponse = <T>(data: T, message?: string): ApiResponse<T> => ({
    success: true,
    ...(message && { message }),
    data
});

export const errorResponse = (message: string, errors?: unknown[]): ApiResponse => ({
    success: false,
    message,
    ...(errors && { errors })
});

/**
 * Object update helper - safely updates object fields
 */
export const updateObjectFields = <T extends object>(
    target: T,
    source: Record<string, unknown>,
    allowedFields: string[]
): void => {
    allowedFields.forEach(field => {
        if (source[field] !== undefined) {
            (target as Record<string, unknown>)[field] = source[field];
        }
    });
};

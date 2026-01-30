/**
 * Custom Application Error class for consistent error handling
 */
export class AppError extends Error {
    public readonly statusCode: number;
    public readonly isOperational: boolean;
    public readonly code?: string;

    constructor(
        message: string,
        statusCode = 500,
        code?: string,
        isOperational = true
    ) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = isOperational;
        this.code = code;

        // Maintains proper stack trace
        Error.captureStackTrace(this, this.constructor);
    }

    static badRequest(message: string, code?: string): AppError {
        return new AppError(message, 400, code);
    }

    static unauthorized(message = 'Unauthorized'): AppError {
        return new AppError(message, 401, 'UNAUTHORIZED');
    }

    static forbidden(message = 'Forbidden'): AppError {
        return new AppError(message, 403, 'FORBIDDEN');
    }

    static notFound(message = 'Resource not found'): AppError {
        return new AppError(message, 404, 'NOT_FOUND');
    }

    static conflict(message: string): AppError {
        return new AppError(message, 409, 'CONFLICT');
    }

    static internal(message = 'Internal server error'): AppError {
        return new AppError(message, 500, 'INTERNAL_ERROR', false);
    }
}

export default AppError;

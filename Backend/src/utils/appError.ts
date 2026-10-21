export class AppError extends Error {
    statusCode: number;
    isOperational: boolean;

    constructor(message: string, statusCode = 400) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = true;
        Error.captureStackTrace(this, this.constructor);
    }

    static badRequest(message: string) {
        return new AppError(message, 400);
    }
    static unauthorized(message = "Unauthorized") {
        return new AppError(message, 401);
    }
    static forbidden(message = "Forbidden") {
        return new AppError(message, 403);
    }
    static notFound(message = "Not found") {
        return new AppError(message, 404);
    }
    static conflict(message: string) {
        return new AppError(message, 409);
    }
}
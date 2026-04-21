import { Request, Response, NextFunction } from "express";

/**
 * Global Error Handling Middleware
 * 
 * Catches all unhandled errors and returns a sanitized JSON response.
 * Prevents stack traces from leaking to the client in production.
 */
export const errorMiddleware = (
    err: any,
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const statusCode = err.statusCode || 500;
    const isProduction = process.env.NODE_ENV === "production";

    // Log error for internal monitoring
    console.error(`[ERROR] ${req.method} ${req.path}:`, err);

    res.status(statusCode).json({
        status: "error",
        message: err.message || "An unexpected error occurred",
        // Only include stack trace in development
        ...(isProduction ? {} : { stack: err.stack }),
    });
};

/**
 * Custom Error Class for API Errors
 */
export class ApiError extends Error {
    statusCode: number;

    constructor(message: string, statusCode: number = 400) {
        super(message);
        this.statusCode = statusCode;
        Object.setPrototypeOf(this, ApiError.prototype);
    }
}

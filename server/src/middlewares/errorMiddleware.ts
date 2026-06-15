import { Request, Response, NextFunction } from "express";
import { logger } from "../utils/logger";

interface ErrorWithStatusCode extends Error {
    statusCode?: number;
}

export const errorMiddleware = (
    err: ErrorWithStatusCode,
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const statusCode = err.statusCode || 500;
    const isProduction = process.env.NODE_ENV === "production";

    logger.error({ err, method: req.method, path: req.path, statusCode }, "[ERROR]");

    const message = (isProduction && statusCode === 500)
        ? "An internal server error occurred"
        : err.message || "An unexpected error occurred";

    res.status(statusCode).json({
        status: "error",
        message,
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

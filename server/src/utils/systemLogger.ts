import { prisma } from "../config/prisma";

export enum LogLevel {
    INFO = "INFO",
    WARN = "WARN",
    ERROR = "ERROR",
    CRITICAL = "CRITICAL",
}

export interface LogEntry {
    level: LogLevel;
    category: "INFRASTRUCTURE" | "CAMPAIGN" | "SENDER" | "SECURITY" | "SUBSCRIPTION";
    message: string;
    metadata?: Record<string, any>;
}

/**
 * System Logger — writes critical infrastructure and application events
 * to the SystemAuditLog table in PostgreSQL.
 * 
 * WHY use this: Standard console logs are ephemeral and hard to query at scale.
 * Persisting key events in the DB allows for building monitoring dashboards
 * and automated alert triggers.
 */
export async function systemLog(entry: LogEntry): Promise<void> {
    const { level, category, message, metadata } = entry;

    // Always log to console first for immediate visibility
    const consoleMethod = level === LogLevel.ERROR || level === LogLevel.CRITICAL ? "error" : "log";
    console[consoleMethod](`[SYSTEM][${category}][${level}] ${message}`, metadata || "");

    try {
        await prisma.systemAuditLog.create({
            data: {
                level,
                category,
                message,
                metadata: metadata || {},
            },
        });
    } catch (err) {
        // Fail-safe: if logging to the DB fails (e.g. DB is down), don't crash the application
        console.error("[CRITICAL] Failed to write to SystemAuditLog:", err);
    }
}

// Convenience helpers
export const sysLog = {
    info: (category: LogEntry["category"], message: string, metadata?: Record<string, any>) =>
        systemLog({ level: LogLevel.INFO, category, message, metadata }),

    warn: (category: LogEntry["category"], message: string, metadata?: Record<string, any>) =>
        systemLog({ level: LogLevel.WARN, category, message, metadata }),

    error: (category: LogEntry["category"], message: string, metadata?: Record<string, any>) =>
        systemLog({ level: LogLevel.ERROR, category, message, metadata }),

    critical: (category: LogEntry["category"], message: string, metadata?: Record<string, any>) =>
        systemLog({ level: LogLevel.CRITICAL, category, message, metadata }),
};

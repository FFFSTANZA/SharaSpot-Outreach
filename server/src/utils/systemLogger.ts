import { Prisma } from "@prisma/client";
import { prisma } from "../config/prisma";
import { logger } from "./logger";

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
    metadata?: Record<string, unknown>;
}

export async function systemLog(entry: LogEntry): Promise<void> {
    const { level, category, message, metadata } = entry;

    const logFn = level === LogLevel.ERROR || level === LogLevel.CRITICAL
      ? (msg: string, meta?: unknown) => logger.error({ category, ...(meta as Record<string, unknown>) }, msg)
      : (msg: string, meta?: unknown) => logger.info({ category, ...(meta as Record<string, unknown>) }, msg);
    logFn(`[${category}] ${message}`, metadata);

    try {
        await prisma.systemAuditLog.create({
            data: {
                level,
                category,
                message,
                metadata: metadata as Prisma.InputJsonValue,
            },
        });
    } catch (err) {
        logger.error({ err }, "Failed to write to SystemAuditLog");
    }
}

export const sysLog = {
    info: (category: LogEntry["category"], message: string, metadata?: Record<string, unknown>) =>
        systemLog({ level: LogLevel.INFO, category, message, metadata }),

    warn: (category: LogEntry["category"], message: string, metadata?: Record<string, unknown>) =>
        systemLog({ level: LogLevel.WARN, category, message, metadata }),

    error: (category: LogEntry["category"], message: string, metadata?: Record<string, unknown>) =>
        systemLog({ level: LogLevel.ERROR, category, message, metadata }),

    critical: (category: LogEntry["category"], message: string, metadata?: Record<string, unknown>) =>
        systemLog({ level: LogLevel.CRITICAL, category, message, metadata }),
};

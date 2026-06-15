import { CorsOptions } from "cors";

const localhostOriginPattern = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i;

const allowedOrigins = new Set(
    [
        process.env.FRONTEND_URL || "",
        ...(process.env.CORS_ORIGIN || "")
            .split(",")
            .map((origin) => origin.trim())
            .filter(Boolean),
        "http://localhost",
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:8000",
        "http://127.0.0.1",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001",
        "http://127.0.0.1:8000",
    ].filter(Boolean)
);

const corsOptions: CorsOptions = {
    origin: (origin, callback) => {
        if (process.env.NODE_ENV === "development") {
            return callback(null, true);
        }

        if (!origin) {
            return callback(null, true);
        }

        if (allowedOrigins.has(origin) || localhostOriginPattern.test(origin)) {
            callback(null, true);
        } else {
            callback(null, false);
        }
    },
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    credentials: true
};

export default corsOptions;

import { CorsOptions } from "cors";

const allowedOrigins = [
    process.env.FRONTEND_URL || "https://sharaspot.in",
    "http://localhost:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:3001"
];

const corsOptions: CorsOptions = {
    origin: (origin, callback) => {
        // In development, allow all origins to avoid local networking issues (CORS, IP vs Localhost, etc)
        if (process.env.NODE_ENV === "development" || !origin) {
            return callback(null, true);
        }

        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error("Not allowed by CORS"));
        }
    },
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true
};

export default corsOptions;

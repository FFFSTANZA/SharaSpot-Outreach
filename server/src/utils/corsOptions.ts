import { CorsOptions } from "cors";
const corsOptions: CorsOptions = { origin: true, methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"], allowedHeaders: ["Content-Type", "Authorization"], credentials: true };
export default corsOptions;

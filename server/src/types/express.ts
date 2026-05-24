import "express";

declare module "express-serve-static-core" {
  interface Request {
    user?: {
      id: string;
      email: string;
      activeOrganizationId?: string | null;
    };
    rawBody?: Buffer | string;
  }
}

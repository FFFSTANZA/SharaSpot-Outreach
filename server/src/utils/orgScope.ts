import { Request, Response, NextFunction } from "express";

export interface OrgScope {
  organizationId?: string;
  userId: string;
}

export function getOrgScope(req: Pick<Request, 'user'>): OrgScope {
  const orgId = req.user?.activeOrganizationId ?? null;
  const userId = req.user!.id;
  if (orgId) return { organizationId: orgId, userId };
  return { userId };
}

export function senderReadScope(req: Pick<Request, 'user'>): { userId: string } | { OR: ({ organizationId: string } | { userId: string; organizationId: null })[] } {
  const orgId = req.user?.activeOrganizationId ?? null;
  const uid = req.user!.id;
  if (orgId) return { OR: [{ organizationId: orgId }, { userId: uid, organizationId: null }] };
  return { userId: uid };
}

export function getOrgId(req: Pick<Request, 'user'>): string | null {
  return req.user?.activeOrganizationId ?? null;
}

export function withOrgScope<T extends Record<string, any>>(
  req: Pick<Request, 'user'>,
  where: T,
): T & ({ organizationId: string } | { userId: string }) {
  const scope = getOrgScope(req);
  if (scope.organizationId) {
    return { ...where, organizationId: scope.organizationId } as any;
  }
  return { ...where, userId: scope.userId } as any;
}

export function orgCreateData<T extends Record<string, any>>(
  req: Pick<Request, 'user'>,
  data: T & { userId: string },
): T & { userId: string; organizationId?: string } {
  const orgId = getOrgId(req);
  if (orgId) return { ...data, organizationId: orgId };
  return data;
}

export function orgScopeMiddleware(req: Request, res: Response, next: NextFunction): void {
  const scope = getOrgScope(req);
  (req as any).orgScope = scope;
  next();
}

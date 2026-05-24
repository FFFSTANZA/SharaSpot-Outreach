jest.mock("../../config/prisma", () => ({
  prisma: {
    organizationMember: {
      findUnique: jest.fn(),
    },
  },
}));

import { Request, Response, NextFunction } from "express";
import { prisma } from "../../config/prisma";
import { requireOrgWriteAccess } from "../../middlewares/orgRoleMiddleware";

const mockFindMembership = prisma.organizationMember.findUnique as jest.Mock;

const makeReqRes = (overrides: Partial<Request> = {}) => {
  const req = {
    method: "POST",
    path: "/contacts",
    user: { id: "u1", email: "u1@example.com", activeOrganizationId: "org1" },
    ...overrides,
  } as unknown as Request;
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  } as unknown as Response;
  const next = jest.fn() as NextFunction;
  return { req, res, next };
};

describe("requireOrgWriteAccess", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFindMembership.mockResolvedValue({ role: "MEMBER" });
  });

  it("allows read methods without membership lookup", async () => {
    const { req, res, next } = makeReqRes({ method: "GET" as any });
    await requireOrgWriteAccess(req, res, next);
    expect(mockFindMembership).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalled();
  });

  it("allows organization route writes to support org workflows", async () => {
    const { req, res, next } = makeReqRes({ path: "/organizations/switch" as any });
    await requireOrgWriteAccess(req, res, next);
    expect(mockFindMembership).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalled();
  });

  it("blocks viewers from write operations", async () => {
    mockFindMembership.mockResolvedValue({ role: "VIEWER" });
    const { req, res, next } = makeReqRes();
    await requireOrgWriteAccess(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ message: "Viewer role has read-only access" });
    expect(next).not.toHaveBeenCalled();
  });

  it("blocks writes when membership is missing", async () => {
    mockFindMembership.mockResolvedValue(null);
    const { req, res, next } = makeReqRes();
    await requireOrgWriteAccess(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ message: "Access denied to this organization" });
    expect(next).not.toHaveBeenCalled();
  });
});

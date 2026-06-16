import request from "supertest";

process.env.JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || "test-access-secret-which-is-long-enough";
process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "test-refresh-secret-which-is-long-enough";
process.env.ACCESS_TOKEN_EXPIRES = process.env.ACCESS_TOKEN_EXPIRES || "1h";
process.env.REFRESH_TOKEN_EXPIRES = process.env.REFRESH_TOKEN_EXPIRES || "30d";
process.env.CLIENT_URL = process.env.CLIENT_URL || "http://localhost:3000";
process.env.NODE_ENV = "test";

jest.mock("../../middlewares/authMiddleware", () => ({
  authMiddleware: (req: any, _res: any, next: any) => {
    const raw = req.headers["x-test-user"];
    if (typeof raw === "string") {
      req.user = JSON.parse(raw);
    } else {
      req.user = { id: "owner-1", email: "owner@example.com", activeOrganizationId: "org-1" };
    }
    next();
  },
}));

jest.mock("../../middlewares/orgRoleMiddleware", () => ({
  requireOrgWriteAccess: (_req: any, _res: any, next: any) => next(),
}));

jest.mock("../../config/prisma", () => ({
  prisma: {
    organizationMember: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
    },
    organizationInvite: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    refreshToken: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    contact: { findMany: jest.fn(), count: jest.fn(), findFirst: jest.fn(), findUnique: jest.fn(), update: jest.fn(), updateMany: jest.fn(), deleteMany: jest.fn(), upsert: jest.fn(), createMany: jest.fn() },
    contactList: { findFirst: jest.fn(), findMany: jest.fn(), update: jest.fn(), create: jest.fn(), deleteMany: jest.fn(), delete: jest.fn() },
    tag: { findFirst: jest.fn(), findMany: jest.fn(), create: jest.fn(), deleteMany: jest.fn(), update: jest.fn(), delete: jest.fn() },
    callTask: { findFirst: jest.fn(), create: jest.fn(), update: jest.fn(), findMany: jest.fn(), count: jest.fn(), updateMany: jest.fn(), deleteMany: jest.fn() },
    callSession: { findFirst: jest.fn(), create: jest.fn(), update: jest.fn(), updateMany: jest.fn(), findMany: jest.fn() },
    contactActivity: { create: jest.fn(), updateMany: jest.fn() },
    note: { updateMany: jest.fn() },
    prmSegmentContact: { findMany: jest.fn(), createMany: jest.fn(), deleteMany: jest.fn() },
    prmSegment: { create: jest.fn(), findMany: jest.fn(), findFirst: jest.fn(), update: jest.fn(), updateMany: jest.fn() },
    prmBulkActionLog: { create: jest.fn(), findFirst: jest.fn(), update: jest.fn() },
    organization: { findUnique: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn() },
    emailCampaign: { updateMany: jest.fn() },
    sender: { updateMany: jest.fn() },
    emailTemplate: { updateMany: jest.fn() },
    webhook: { updateMany: jest.fn() },
    mcpApiKey: { updateMany: jest.fn() },
    bounceList: { updateMany: jest.fn() },
    inboxEmail: { updateMany: jest.fn() },
    inboxThread: { updateMany: jest.fn() },
    $queryRaw: jest.fn(),
    $disconnect: jest.fn(),
    $transaction: jest.fn(async (cb: any) => cb({
      organizationMember: {
        findUnique: (...args: any[]) => (require("../../config/prisma").prisma.organizationMember.findUnique as jest.Mock)(...args),
        count: (...args: any[]) => (require("../../config/prisma").prisma.organizationMember.count as jest.Mock)(...args),
        create: (...args: any[]) => (require("../../config/prisma").prisma.organizationMember.create as jest.Mock)(...args),
      },
      organizationInvite: {
        findUnique: (...args: any[]) => (require("../../config/prisma").prisma.organizationInvite.findUnique as jest.Mock)(...args),
        update: (...args: any[]) => (require("../../config/prisma").prisma.organizationInvite.update as jest.Mock)(...args),
      },
      user: {
        update: (...args: any[]) => (require("../../config/prisma").prisma.user.update as jest.Mock)(...args),
      },
      contact: { updateMany: jest.fn(), update: jest.fn() },
      callTask: { updateMany: jest.fn(), create: jest.fn(), update: jest.fn(), findFirst: jest.fn() },
      callSession: { updateMany: jest.fn(), update: jest.fn(), findFirst: jest.fn(), create: jest.fn() },
      note: { updateMany: jest.fn() },
      contactActivity: { updateMany: jest.fn(), create: jest.fn() },
      prmSegmentContact: { findMany: jest.fn(), deleteMany: jest.fn(), createMany: jest.fn() },
      prmBulkActionLog: { create: jest.fn(), update: jest.fn() },
      contactList: { update: jest.fn() },
    })),
  },
}));

jest.mock("../../config/redis", () => ({
  redis: {
    ping: jest.fn().mockResolvedValue("PONG"),
    get: jest.fn().mockResolvedValue(String(Date.now())),
    del: jest.fn().mockResolvedValue(1),
    quit: jest.fn(),
  },
}));

import { prisma } from "../../config/prisma";
import { app } from "../../index";

describe("Organization invite routes e2e simulation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (prisma.organizationMember.findUnique as jest.Mock).mockResolvedValue({ role: "OWNER", userId: "owner-1" });
    (prisma.organizationMember.count as jest.Mock).mockResolvedValue(1);
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
    (prisma.organizationInvite.findFirst as jest.Mock).mockResolvedValue(null);
    (prisma.organizationInvite.create as jest.Mock).mockResolvedValue({
      id: "inv-1",
      organizationId: "org-1",
      email: "external@example.com",
      role: "MEMBER",
      tokenHash: "hash",
      invitedBy: "owner-1",
      expiresAt: new Date(Date.now() + 86400000),
      acceptedAt: null,
      revokedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    (prisma.organizationInvite.findUnique as jest.Mock).mockResolvedValue({
      id: "inv-1",
      organizationId: "org-1",
      email: "external@example.com",
      role: "MEMBER",
      tokenHash: "hash",
      invitedBy: "owner-1",
      expiresAt: new Date(Date.now() + 86400000),
      acceptedAt: null,
      revokedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      organization: { id: "org-1", name: "Team One" },
    });
    (prisma.organizationInvite.update as jest.Mock).mockResolvedValue({});
    (prisma.user.update as jest.Mock).mockResolvedValue({});
  });

  it("creates external invite and returns invite link", async () => {
    const res = await request(app)
      .post("/api/organizations/current/invite")
      .set("Authorization", "Bearer fake")
      .send({ email: "external@example.com", role: "MEMBER" });

    expect(res.status).toBe(201);
    expect(res.body.type).toBe("invite");
    expect(res.body.invite.email).toBe("external@example.com");
    expect(String(res.body.invite.inviteLink)).toContain("/login?inviteToken=");
  });

  it("creates a pending invite for an existing account instead of auto-joining it", async () => {
    (prisma.organizationInvite.create as jest.Mock).mockResolvedValueOnce({
      id: "inv-2",
      organizationId: "org-1",
      email: "external@example.com",
      role: "ADMIN",
      tokenHash: "hash-2",
      invitedBy: "owner-1",
      expiresAt: new Date(Date.now() + 86400000),
      acceptedAt: null,
      revokedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce({
      id: "user-2",
      email: "external@example.com",
      activeOrganizationId: "personal-org",
    });
    (prisma.organizationMember.findUnique as jest.Mock)
      .mockResolvedValueOnce({ role: "OWNER", userId: "owner-1" })
      .mockResolvedValueOnce(null);

    const res = await request(app)
      .post("/api/organizations/current/invite")
      .set("Authorization", "Bearer fake")
      .send({ email: "external@example.com", role: "ADMIN" });

    expect(res.status).toBe(201);
    expect(prisma.organizationMember.create).not.toHaveBeenCalled();
    expect(res.body.type).toBe("invite");
    expect(res.body.invite.role).toBe("ADMIN");
  });

  it("accepts invite and returns org switched token context", async () => {
    (prisma.organizationMember.findUnique as jest.Mock).mockResolvedValueOnce(null).mockResolvedValueOnce({ role: "MEMBER", userId: "user-2" });
    (prisma.organizationMember.count as jest.Mock).mockResolvedValueOnce(2);

    const res = await request(app)
      .post("/api/organizations/invites/accept")
      .set("Authorization", "Bearer fake")
      .set("x-test-user", JSON.stringify({ id: "user-2", email: "external@example.com", activeOrganizationId: null }))
      .send({ token: "raw-invite-token" });

    expect(res.status).toBe(200);
    expect(res.body.accepted).toBe(true);
    expect(res.body.organizationId).toBe("org-1");
    expect(typeof res.body.accessToken).toBe("string");
  });

});

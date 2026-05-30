process.env.JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || "test-access-secret";
process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "test-refresh-secret";
process.env.ACCESS_TOKEN_EXPIRES = process.env.ACCESS_TOKEN_EXPIRES || "1h";
process.env.REFRESH_TOKEN_EXPIRES = process.env.REFRESH_TOKEN_EXPIRES || "30d";
process.env.CLIENT_URL = process.env.CLIENT_URL || "http://localhost:3000";

jest.mock("../../config/prisma", () => ({
  prisma: {
    organizationMember: {
      findUnique: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    organizationInvite: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  },
}));

jest.mock("../../utils/premiumCheck", () => ({
  invalidatePremiumCache: jest.fn(),
}));

import { acceptInvite, acceptOrganizationInviteForUser, inviteMember } from "../../controllers/organizationControllers";
import { prisma } from "../../config/prisma";

const mockReqRes = (body: any = {}, user: any = { id: "owner-1", email: "owner@example.com", activeOrganizationId: "org-1" }) => {
  const req = { body, user, params: {}, query: {} } as any;
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    sendStatus: jest.fn().mockReturnThis(),
  } as any;
  return { req, res };
};

describe("organization external invite simulation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (prisma.organizationMember.findUnique as jest.Mock).mockReset();
    (prisma.organizationMember.count as jest.Mock).mockReset();
    (prisma.organizationMember.create as jest.Mock).mockReset();
    (prisma.user.findUnique as jest.Mock).mockReset();
    (prisma.user.update as jest.Mock).mockReset();
    (prisma.organizationInvite.findFirst as jest.Mock).mockReset();
    (prisma.organizationInvite.findUnique as jest.Mock).mockReset();
    (prisma.organizationInvite.create as jest.Mock).mockReset();
    (prisma.organizationInvite.update as jest.Mock).mockReset();
    (prisma.organizationMember.findUnique as jest.Mock).mockResolvedValue({ role: "OWNER" });
    (prisma.organizationMember.count as jest.Mock).mockResolvedValue(1);
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
    (prisma.organizationInvite.findFirst as jest.Mock).mockResolvedValue(null);
    (prisma.organizationInvite.create as jest.Mock).mockResolvedValue({
      id: "invite-1",
      email: "external@example.com",
      role: "MEMBER",
      expiresAt: new Date(Date.now() + 86400000),
      createdAt: new Date(),
    });
    (prisma.organizationInvite.findUnique as jest.Mock).mockResolvedValue({
      id: "invite-1",
      organizationId: "org-1",
      email: "external@example.com",
      role: "MEMBER",
      invitedBy: "owner-1",
      expiresAt: new Date(Date.now() + 86400000),
      acceptedAt: null,
      revokedAt: null,
      organization: { id: "org-1", name: "Team One" },
    });
    (prisma.organizationInvite.update as jest.Mock).mockResolvedValue({});
  });

  it("creates an external invite with link when user does not exist", async () => {
    const { req, res } = mockReqRes({ email: "external@example.com", role: "MEMBER" });
    await inviteMember(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "invite",
        invite: expect.objectContaining({
          email: "external@example.com",
          role: "MEMBER",
          inviteLink: expect.stringContaining("/login?inviteToken="),
        }),
      }),
    );
  });

  it("accepts invite and returns org-switched access token for matching email", async () => {
    (prisma.organizationMember.findUnique as jest.Mock)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ role: "MEMBER" });
    (prisma.organizationMember.count as jest.Mock).mockResolvedValue(2);

    const { req, res } = mockReqRes(
      { token: "token-abc" },
      { id: "user-2", email: "external@example.com", activeOrganizationId: null },
    );
    await acceptInvite(req, res);

    expect(prisma.organizationMember.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          organizationId: "org-1",
          userId: "user-2",
          role: "MEMBER",
        }),
      }),
    );
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: "user-2" },
      data: { activeOrganizationId: "org-1" },
    });
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        accepted: true,
        organizationId: "org-1",
        accessToken: expect.any(String),
      }),
    );
  });

  it("returns team_full when invite acceptance hits team limit", async () => {
    (prisma.organizationMember.findUnique as jest.Mock).mockResolvedValue(null);
    (prisma.organizationMember.count as jest.Mock).mockResolvedValue(5);
    const result = await acceptOrganizationInviteForUser("token-abc", "user-2", "external@example.com");
    expect(result).toEqual({ accepted: false, reason: "team_full" });
    expect(prisma.organizationMember.create).not.toHaveBeenCalled();
  });
});

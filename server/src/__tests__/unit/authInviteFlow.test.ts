process.env.JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || "test-access-secret";
process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "test-refresh-secret";
process.env.ACCESS_TOKEN_EXPIRES = process.env.ACCESS_TOKEN_EXPIRES || "1h";
process.env.REFRESH_TOKEN_EXPIRES = process.env.REFRESH_TOKEN_EXPIRES || "30d";
process.env.GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "google-client-id";

const mockVerifyIdToken = jest.fn();

jest.mock("google-auth-library", () => ({
  OAuth2Client: jest.fn().mockImplementation(() => ({
    verifyIdToken: mockVerifyIdToken,
  })),
}));

jest.mock("../../config/prisma", () => ({
  prisma: {
    user: {
      upsert: jest.fn(),
      update: jest.fn(),
      findUnique: jest.fn(),
    },
    organizationMember: {
      findFirst: jest.fn(),
    },
    organization: {
      create: jest.fn(),
    },
    sender: {
      updateMany: jest.fn(),
    },
    refreshToken: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
  },
}));

jest.mock("../../controllers/organizationControllers", () => ({
  acceptOrganizationInviteForUser: jest.fn(),
}));

jest.mock("../../utils/geoUtils", () => ({
  extractClientIp: jest.fn(() => "203.0.113.1"),
  getCountryFromIp: jest.fn().mockResolvedValue(null),
  isIndia: jest.fn(() => false),
}));

import { googleLogin } from "../../controllers/authControllers";
import { prisma } from "../../config/prisma";
import { acceptOrganizationInviteForUser } from "../../controllers/organizationControllers";

const mockReqRes = (body: any = {}) => {
  const req = {
    body,
    cookies: {},
  } as any;
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    cookie: jest.fn().mockReturnThis(),
    sendStatus: jest.fn().mockReturnThis(),
  } as any;
  return { req, res };
};

describe("auth invite flow simulation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockVerifyIdToken.mockResolvedValue({
      getPayload: () => ({
        email: "newuser@example.com",
        name: "New User",
        picture: "https://example.com/avatar.png",
      }),
    });
    (prisma.user.upsert as jest.Mock).mockResolvedValue({
      id: "u1",
      email: "newuser@example.com",
      name: "New User",
      avatarUrl: "https://example.com/avatar.png",
      activeOrganizationId: null,
    });
    (prisma.user.update as jest.Mock).mockResolvedValue({
      id: "u1",
      email: "newuser@example.com",
      activeOrganizationId: "org-personal",
    });
    (prisma.user.findUnique as jest.Mock)
      .mockResolvedValueOnce(null)  // 1st: existing user check → isNewUser = true
      .mockResolvedValueOnce({      // 2nd: freshUser (after upsert)
        id: "u1",
        email: "newuser@example.com",
        activeOrganizationId: "org-personal",
      })
      .mockResolvedValue({          // 3rd: finalUser
        id: "u1",
        email: "newuser@example.com",
        name: "New User",
        avatarUrl: "https://example.com/avatar.png",
        activeOrganizationId: "org-personal",
      });
    (prisma.organizationMember.findFirst as jest.Mock).mockResolvedValue(null);
    (prisma.organization.create as jest.Mock).mockResolvedValue({
      id: "org-personal",
      createdAt: new Date(),
    });
    (prisma.refreshToken.create as jest.Mock).mockResolvedValue({});
    (acceptOrganizationInviteForUser as jest.Mock).mockResolvedValue({ accepted: true, organizationId: "org-invite" });
  });

  it("accepts invite during google login and sets active organization from invite", async () => {
    (prisma.user.findUnique as jest.Mock).mockReset();
    (prisma.user.findUnique as jest.Mock)
      .mockResolvedValueOnce(null)  // 1st: existing user check → isNewUser = true
      .mockResolvedValueOnce({      // 2nd: freshUser (after invite accepted)
        id: "u1",
        email: "newuser@example.com",
        activeOrganizationId: "org-invite",
      })
      .mockResolvedValue({          // 3rd: finalUser
        id: "u1",
        email: "newuser@example.com",
        name: "New User",
        avatarUrl: "https://example.com/avatar.png",
        activeOrganizationId: "org-invite",
      });

    const { req, res } = mockReqRes({ idToken: "id-token", inviteToken: "invite-token" });
    await googleLogin(req, res);

    expect(acceptOrganizationInviteForUser).toHaveBeenCalledWith("invite-token", "u1", "newuser@example.com");
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        accessToken: expect.any(String),
        user: expect.objectContaining({
          activeOrganizationId: "org-invite",
        }),
      }),
    );
  });

  it("creates personal workspace when invite acceptance fails and no active org remains", async () => {
    (acceptOrganizationInviteForUser as jest.Mock).mockResolvedValue({ accepted: false, reason: "invalid_or_expired" });
    (prisma.user.findUnique as jest.Mock).mockReset();
    (prisma.user.findUnique as jest.Mock)
      .mockResolvedValueOnce(null)  // 1st: existing user check → isNewUser = true
      .mockResolvedValueOnce({      // 2nd: freshUser (invite failed)
        id: "u1",
        email: "newuser@example.com",
        activeOrganizationId: null,
      })
      .mockResolvedValue({          // 3rd: finalUser (after fallback workspace created)
        id: "u1",
        email: "newuser@example.com",
        name: "New User",
        avatarUrl: "https://example.com/avatar.png",
        activeOrganizationId: "org-personal",
      });

    const { req, res } = mockReqRes({ idToken: "id-token", inviteToken: "bad-token" });
    await googleLogin(req, res);

    expect(prisma.organization.create).toHaveBeenCalledTimes(1);
    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "u1" },
        data: { activeOrganizationId: "org-personal" },
      }),
    );
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        accessToken: expect.any(String),
      }),
    );
  });
});

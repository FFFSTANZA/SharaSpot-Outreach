jest.mock("../../config/prisma", () => ({
  prisma: {
    organizationMember: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      delete: jest.fn(),
      update: jest.fn(),
    },
    user: {
      updateMany: jest.fn(),
    },
  },
}));

jest.mock("../../utils/premiumCheck", () => ({
  invalidatePremiumCache: jest.fn(),
}));

jest.mock("../../utils/jwt", () => ({
  signAccessToken: jest.fn().mockReturnValue("test-access-token"),
}));

import { prisma } from "../../config/prisma";
import { removeMember, updateMemberRole } from "../../controllers/organizationControllers";

const mockReqRes = (params: any = {}, body: any = {}) => {
  const req = {
    params,
    body,
    user: { id: "owner-1", email: "owner@example.com", activeOrganizationId: "org-1" },
  } as any;

  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    sendStatus: jest.fn().mockReturnThis(),
  } as any;

  return { req, res };
};

describe("organization membership safety", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (prisma.organizationMember.findUnique as jest.Mock).mockResolvedValue({ role: "OWNER", userId: "owner-1" });
  });

  it("blocks cross-organization member removal by scoping target lookup", async () => {
    (prisma.organizationMember.findFirst as jest.Mock).mockResolvedValue(null);

    const { req, res } = mockReqRes({ memberId: "member-foreign" });
    await removeMember(req, res);

    expect(prisma.organizationMember.findFirst).toHaveBeenCalledWith({
      where: { id: "member-foreign", organizationId: "org-1" },
    });
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it("blocks cross-organization role updates by scoping target lookup", async () => {
    (prisma.organizationMember.findFirst as jest.Mock).mockResolvedValue(null);

    const { req, res } = mockReqRes({ memberId: "member-foreign" }, { role: "ADMIN" });
    await updateMemberRole(req, res);

    expect(prisma.organizationMember.findFirst).toHaveBeenCalledWith({
      where: { id: "member-foreign", organizationId: "org-1" },
    });
    expect(res.status).toHaveBeenCalledWith(404);
  });
});

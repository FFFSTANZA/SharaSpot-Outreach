jest.mock("../../config/prisma", () => ({
  prisma: {
    mcpApiKey: {
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    organizationMember: {
      findUnique: jest.fn(),
    },
  },
}));

process.env.ENCRYPTION_KEY = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";

import { prisma } from "../../config/prisma";
import { normalizePermissions, validateMcpApiKey } from "../../mcp/services/apiKeyService";

const mockFindFirst = prisma.mcpApiKey.findFirst as jest.Mock;
const mockUpdate = prisma.mcpApiKey.update as jest.Mock;
const mockFindMembership = prisma.organizationMember.findUnique as jest.Mock;

describe("mcp api key service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUpdate.mockResolvedValue({});
    mockFindMembership.mockResolvedValue({ userId: "u1" });
  });

  it("defaults malformed permissions to read access", () => {
    expect(normalizePermissions({ access: "invalid", areas: ["contacts"] })).toEqual({
      access: "read",
      areas: ["contacts"],
    });
  });

  it("rejects organization-scoped keys when owner is not a workspace member", async () => {
    mockFindFirst.mockResolvedValue({
      id: "k1",
      userId: "u1",
      organizationId: "org1",
      permissions: { access: "write", areas: ["contacts"] },
      expiresAt: null,
    });
    mockFindMembership.mockResolvedValue(null);

    const result = await validateMcpApiKey(`msk_${"a".repeat(64)}`);

    expect(result).toBeNull();
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("accepts organization-scoped keys when owner membership exists", async () => {
    mockFindFirst.mockResolvedValue({
      id: "k1",
      userId: "u1",
      organizationId: "org1",
      permissions: { access: "write", areas: ["contacts"] },
      expiresAt: null,
    });

    const result = await validateMcpApiKey(`msk_${"b".repeat(64)}`);

    expect(result).toMatchObject({ id: "k1", userId: "u1", organizationId: "org1" });
    expect(mockFindMembership).toHaveBeenCalledWith({
      where: { organizationId_userId: { organizationId: "org1", userId: "u1" } },
      select: { userId: true },
    });
    expect(mockUpdate).toHaveBeenCalledTimes(1);
  });
});

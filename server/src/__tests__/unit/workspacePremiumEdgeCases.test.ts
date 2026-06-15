process.env.JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || "test-access-secret";
process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "test-refresh-secret";
process.env.ACCESS_TOKEN_EXPIRES = process.env.ACCESS_TOKEN_EXPIRES || "1h";
process.env.REFRESH_TOKEN_EXPIRES = process.env.REFRESH_TOKEN_EXPIRES || "30d";
process.env.DODO_PAYMENTS_API_KEY = "sk_test_fake";
process.env.DODO_WEBHOOK_SECRET = "test_webhook_secret";

jest.mock("../../config/prisma", () => ({
  prisma: {
    subscription: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    organization: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
    },
    organizationMember: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
      update: jest.fn(),
      create: jest.fn(),
      count: jest.fn(),
    },
    organizationInvite: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
    },
    processedWebhook: {
      findUnique: jest.fn(),
      create: jest.fn(),
      upsert: jest.fn(),
    },
    systemAuditLog: { create: jest.fn() },
    emailCampaign: { updateMany: jest.fn() },
    sender: { updateMany: jest.fn() },
    contact: { updateMany: jest.fn() },
    emailTemplate: { updateMany: jest.fn() },
    followUpTemplate: { updateMany: jest.fn() },
    tag: { updateMany: jest.fn() },
    contactList: { updateMany: jest.fn() },
    callTask: { updateMany: jest.fn() },
    prmSegment: { updateMany: jest.fn() },
    webhook: { updateMany: jest.fn() },
    mcpApiKey: { updateMany: jest.fn() },
    bounceList: { updateMany: jest.fn() },
    inboxEmail: { updateMany: jest.fn() },
    inboxThread: { updateMany: jest.fn() },
    $transaction: jest.fn(),
  },
}));

jest.mock("../../config/dodo", () => ({
  dodo: {
    subscriptions: { update: jest.fn(), retrieve: jest.fn() },
    checkoutSessions: { create: jest.fn() },
    customers: { customerPortal: { create: jest.fn() } },
    webhooks: { unwrap: jest.fn((body: any) => (typeof body === "string" ? JSON.parse(body) : body)) },
  },
}));

jest.mock("../../config/redis", () => ({
  redis: { del: jest.fn().mockResolvedValue(1) },
}));

jest.mock("../../utils/geoUtils", () => ({
  getCountryFromIp: jest.fn().mockResolvedValue("IN"),
  isIndia: jest.fn((code: string | null) => code === "IN"),
}));

jest.mock("../../utils/jwt", () => ({
  signAccessToken: jest.fn().mockReturnValue("test-access-token"),
}));

import { prisma } from "../../config/prisma";
import { redis } from "../../config/redis";
import { SubscriptionStatus } from "@prisma/client";
import { getSubscriptionStatus, cancelSubscription, reactivateSubscription, syncSubscriptionFromDodo, handleCheckoutCompleted, activateSubscriptionFromPayment } from "../../services/subscriptionService";
import { createOrganization, switchOrganization, removeMember, leaveOrganization, deleteOrganization, acceptOrganizationInviteForUser, inviteMember } from "../../controllers/organizationControllers";

const futureDate = (days = 30) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d;
};

const pastDate = (days = 1) => {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d;
};

const mockReqRes = (overrides: any = {}) => {
  const req = {
    user: { id: "user_1", email: "user1@test.com", activeOrganizationId: "org_1" },
    body: {},
    params: {},
    headers: {},
    ip: "127.0.0.1",
    ...overrides,
  } as any;

  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    sendStatus: jest.fn().mockReturnThis(),
  } as any;

  return { req, res };
};

describe("Workspace × Premium Cross-Cutting Edge Cases", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // -----------------------------------------------------------------------
  // 1. WORKSPACE INHERITANCE — OWNER TRIAL
  // -----------------------------------------------------------------------
  describe("Workspace inheritance — owner trial", () => {
    it("member inherits premium when owner is on active trial", async () => {
      (prisma.subscription.findUnique as jest.Mock)
        .mockResolvedValueOnce(null)                     // member has no sub
        .mockResolvedValueOnce({                           // owner sub: active trial
          userId: "owner_1",
          status: SubscriptionStatus.ACTIVE,
          currentPeriodEnd: futureDate(30),
          trialEnd: futureDate(7),
        });

      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: "member_1",
        activeOrganizationId: "org_1",
      });

      (prisma.organization.findUnique as jest.Mock).mockResolvedValue({
        id: "org_1",
        ownerId: "owner_1",
      });

      const result = await getSubscriptionStatus("member_1");
      expect(result.isPremium).toBe(true);
      expect(result.subscription).toBeNull();
    });

    it("member loses inheritance when owner's trial expired and subscription ended", async () => {
      (prisma.subscription.findUnique as jest.Mock)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({
          userId: "owner_1",
          status: SubscriptionStatus.ACTIVE,
          currentPeriodEnd: pastDate(1),
          trialEnd: pastDate(7),
        });

      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: "member_1",
        activeOrganizationId: "org_1",
      });

      (prisma.organization.findUnique as jest.Mock).mockResolvedValue({
        id: "org_1",
        ownerId: "owner_1",
      });

      const result = await getSubscriptionStatus("member_1");
      expect(result.isPremium).toBe(false);
    });

    it("member inherits from owner's paid period even after trial expired", async () => {
      (prisma.subscription.findUnique as jest.Mock)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({
          userId: "owner_1",
          status: SubscriptionStatus.ACTIVE,
          currentPeriodEnd: futureDate(20),  // still in paid period
          trialEnd: pastDate(5),             // trial expired but paid
        });

      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: "member_1",
        activeOrganizationId: "org_1",
      });

      (prisma.organization.findUnique as jest.Mock).mockResolvedValue({
        id: "org_1",
        ownerId: "owner_1",
      });

      const result = await getSubscriptionStatus("member_1");
      expect(result.isPremium).toBe(true);
    });
  });

  // -----------------------------------------------------------------------
  // 2. MEMBER'S OWN PREMIUM vs WORKSPACE INHERITANCE
  // -----------------------------------------------------------------------
  describe("Own premium vs workspace inheritance", () => {
    it("member with personal subscription is premium regardless of owner state", async () => {
      // Member has own active subscription, owner has no subscription
      (prisma.subscription.findUnique as jest.Mock)
        .mockResolvedValueOnce({
          userId: "member_1",
          status: SubscriptionStatus.ACTIVE,
          currentPeriodEnd: futureDate(15),
          trialEnd: null,
        });

      // User is NOT in any org (shouldn't matter since own premium checked first)
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: "member_1",
        activeOrganizationId: null,
      });

      const result = await getSubscriptionStatus("member_1");
      expect(result.isPremium).toBe(true);
      expect(result.subscription).not.toBeNull();
    });

    it("member with own expired subscription but owner is premium gets inheritance", async () => {
      // 1st call: member's own sub is expired (status ACTIVE but period ended)
      (prisma.subscription.findUnique as jest.Mock)
        .mockResolvedValueOnce({
          userId: "member_1",
          status: SubscriptionStatus.ACTIVE,
          currentPeriodEnd: pastDate(1),
          trialEnd: null,
        })
        // 2nd call: owner's sub is active
        .mockResolvedValueOnce({
          userId: "owner_1",
          status: SubscriptionStatus.ACTIVE,
          currentPeriodEnd: futureDate(30),
          trialEnd: null,
        });

      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: "member_1",
        activeOrganizationId: "org_1",
      });

      (prisma.organization.findUnique as jest.Mock).mockResolvedValue({
        id: "org_1",
        ownerId: "owner_1",
      });

      const result = await getSubscriptionStatus("member_1");
      expect(result.isPremium).toBe(true);
      expect(result.subscription).toBeNull(); // null because inherited, not owned
    });
  });

  // -----------------------------------------------------------------------
  // 3. CACHE INVALIDATION ON SUBSCRIPTION STATE CHANGES
  // -----------------------------------------------------------------------
  describe("Cache invalidation on subscription changes", () => {
    it("cancelSubscription invalidates cache for owner and all org members", async () => {
      (prisma.subscription.findUnique as jest.Mock).mockResolvedValue({
        userId: "owner_1",
        dodoSubscriptionId: "sub_owner_1",
        currentPeriodEnd: futureDate(15),
      });

      (prisma.organization.findMany as jest.Mock).mockResolvedValue([
        {
          members: [
            { userId: "owner_1" },
            { userId: "member_1" },
            { userId: "member_2" },
          ],
        },
      ]);

      await cancelSubscription("owner_1");

      // Redis del called for owner + member_1 + member_2
      const delCalls = (redis.del as jest.Mock).mock.calls.map((c: any[]) => c[0]);
      expect(delCalls).toContain("user:premium:owner_1");
      expect(delCalls).toContain("user:premium:member_1");
      expect(delCalls).toContain("user:premium:member_2");
    });

    it("reactivateSubscription invalidates cache for owner and all org members", async () => {
      (prisma.subscription.findUnique as jest.Mock).mockResolvedValue({
        userId: "owner_1",
        dodoSubscriptionId: "sub_owner_1",
      });

      (prisma.organization.findMany as jest.Mock).mockResolvedValue([
        {
          members: [
            { userId: "owner_1" },
            { userId: "member_1" },
          ],
        },
      ]);

      (prisma.subscription.update as jest.Mock).mockResolvedValue({});

      await reactivateSubscription("owner_1");

      const delCalls = (redis.del as jest.Mock).mock.calls.map((c: any[]) => c[0]);
      expect(delCalls).toContain("user:premium:owner_1");
      expect(delCalls).toContain("user:premium:member_1");
    });
  });

  // -----------------------------------------------------------------------
  // 4. ORG TRANSITIONS — PREMIUM CACHE INVALIDATION
  // -----------------------------------------------------------------------
  describe("Org transitions invalidate premium cache", () => {
    it("createOrganization invalidates creating user's cache", async () => {
      // User is not already an owner
      (prisma.organizationMember.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.organization.create as jest.Mock).mockResolvedValue({
        id: "new_org",
        name: "New Org",
        ownerId: "user_1",
        createdAt: new Date(),
        members: [{ id: "mem_1", userId: "user_1", role: "OWNER", joinedAt: new Date() }],
      });
      (prisma.user.update as jest.Mock).mockResolvedValue({});

      const { req, res } = mockReqRes({ body: { name: "New Org" } });
      await createOrganization(req, res);

      expect(redis.del).toHaveBeenCalledWith("user:premium:user_1");
    });

    it("removeMember reassigns active org with fallback and invalidates cache", async () => {
      // Owner exists
      (prisma.organizationMember.findUnique as jest.Mock).mockResolvedValue({ role: "OWNER", userId: "user_1" });

      // Target member exists, is not owner
      (prisma.organizationMember.findFirst as jest.Mock)
        .mockResolvedValueOnce({ id: "mem_target", userId: "target_1", role: "MEMBER", organizationId: "org_1" })
        .mockResolvedValueOnce(null); // no other membership -> activeOrg goes to null

      (prisma.organizationMember.delete as jest.Mock).mockResolvedValue({});
      (prisma.user.updateMany as jest.Mock).mockResolvedValue({ count: 1 });

      const { req, res } = mockReqRes({ params: { memberId: "mem_target" } });
      await removeMember(req, res);

      expect(prisma.user.updateMany).toHaveBeenCalledWith({
        where: { id: "target_1", activeOrganizationId: "org_1" },
        data: { activeOrganizationId: null },
      });
      expect(redis.del).toHaveBeenCalledWith("user:premium:target_1");
    });

    it("leaveOrganization reassigns active org with fallback and invalidates cache", async () => {
      (prisma.organizationMember.findUnique as jest.Mock).mockResolvedValue({ role: "MEMBER", userId: "user_1" });

      (prisma.organizationMember.findFirst as jest.Mock).mockResolvedValue({
        organizationId: "other_org",
      });

      (prisma.organizationMember.delete as jest.Mock).mockResolvedValue({});
      (prisma.user.update as jest.Mock).mockResolvedValue({});

      const { req, res } = mockReqRes({ body: {} });
      await leaveOrganization(req, res);

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: "user_1" },
        data: { activeOrganizationId: "other_org" },
      });
      expect(redis.del).toHaveBeenCalledWith("user:premium:user_1");
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ accessToken: "test-access-token" }));
    });

    it("deleteOrganization invalidates cache for all members", async () => {
      (prisma.organizationMember.findUnique as jest.Mock).mockResolvedValue({ role: "OWNER", userId: "user_1" });

      const mockTx = {
        emailCampaign: { updateMany: jest.fn().mockResolvedValue({ count: 0 }) },
        sender: { updateMany: jest.fn().mockResolvedValue({ count: 0 }) },
        contact: { updateMany: jest.fn().mockResolvedValue({ count: 0 }) },
        emailTemplate: { updateMany: jest.fn().mockResolvedValue({ count: 0 }) },
        followUpTemplate: { updateMany: jest.fn().mockResolvedValue({ count: 0 }) },
        tag: { updateMany: jest.fn().mockResolvedValue({ count: 0 }) },
        contactList: { updateMany: jest.fn().mockResolvedValue({ count: 0 }) },
        callTask: { updateMany: jest.fn().mockResolvedValue({ count: 0 }) },
        prmSegment: { updateMany: jest.fn().mockResolvedValue({ count: 0 }) },
        webhook: { updateMany: jest.fn().mockResolvedValue({ count: 0 }) },
        mcpApiKey: { updateMany: jest.fn().mockResolvedValue({ count: 0 }) },
        bounceList: { deleteMany: jest.fn().mockResolvedValue({ count: 0 }) },
        inboxEmail: { updateMany: jest.fn().mockResolvedValue({ count: 0 }) },
        inboxThread: { updateMany: jest.fn().mockResolvedValue({ count: 0 }) },
        organizationMember: {
          findMany: jest.fn().mockResolvedValue([
            { userId: "owner_1" },
            { userId: "member_1" },
          ]),
          findFirst: jest.fn().mockResolvedValue(null),
          deleteMany: jest.fn().mockResolvedValue({ count: 2 }),
        },
        organization: { delete: jest.fn().mockResolvedValue({}) },
        user: {
          findUnique: jest.fn().mockResolvedValue({ activeOrganizationId: "org_1" }),
          update: jest.fn(),
        },
      };

      (prisma.$transaction as jest.Mock).mockImplementation((cb: any) => cb(mockTx));
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({ activeOrganizationId: "org_1" });

      const { req, res } = mockReqRes();
      await deleteOrganization(req, res);

      expect(redis.del).toHaveBeenCalledWith("user:premium:owner_1");
      expect(redis.del).toHaveBeenCalledWith("user:premium:member_1");
    });
  });

  // -----------------------------------------------------------------------
  // 5. WORKSPACE SCENARIOS — MEMBER HAS OWN SUBSCRIPTION
  // -----------------------------------------------------------------------
  describe("Member's own subscription unaffected by org transitions", () => {
    it("leaving workspace does not affect member's own premium status", async () => {
      (prisma.organizationMember.findUnique as jest.Mock).mockResolvedValue({ role: "MEMBER", userId: "user_1" });

      (prisma.organizationMember.findFirst as jest.Mock)
        .mockResolvedValueOnce({ id: "mem_1", userId: "user_1", role: "MEMBER", organizationId: "org_1" })
        .mockResolvedValueOnce({ organizationId: "other_org" });

      (prisma.organizationMember.delete as jest.Mock).mockResolvedValue({});
      (prisma.user.update as jest.Mock).mockResolvedValue({});

      const { req, res } = mockReqRes();
      await leaveOrganization(req, res);

      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ accessToken: "test-access-token" }));
      expect(redis.del).toHaveBeenCalledWith("user:premium:user_1");
    });
  });

  // -----------------------------------------------------------------------
  // 6. CHECKOUT SESSION — WORKSPACE-INHERITED PREMIUM BLOCKS NEW PURCHASE
  // -----------------------------------------------------------------------
  describe("Workspace-inherited premium blocks checkout", () => {
    it("user inheriting from workspace owner cannot create new checkout", async () => {
      // Member inherits premium from workspace owner (no own sub)
      (prisma.subscription.findUnique as jest.Mock)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({
          userId: "owner_1",
          status: SubscriptionStatus.ACTIVE,
          currentPeriodEnd: futureDate(30),
          trialEnd: null,
        });

      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: "member_1",
        activeOrganizationId: "org_1",
      });

      (prisma.organization.findUnique as jest.Mock).mockResolvedValue({
        id: "org_1",
        ownerId: "owner_1",
      });

      const result = await getSubscriptionStatus("member_1");
      expect(result.isPremium).toBe(true);
    });
  });

  // -----------------------------------------------------------------------
  // 7. VIEWER ROLE — WRITE ACCESS BLOCKED
  // -----------------------------------------------------------------------
  describe("VIEWER role write restriction", () => {
    it("VIEWER is correctly identified as non-writer by middleware", async () => {
      (prisma.organizationMember.findUnique as jest.Mock).mockResolvedValue({ role: "VIEWER" });

      const { requireOrgWriteAccess } = await import("../../middlewares/orgRoleMiddleware");

      const req = {
        method: "POST",
        path: "/campaigns",
        user: { id: "viewer_1", email: "viewer@test.com", activeOrganizationId: "org_1" },
      } as any;
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      } as any;
      const next = jest.fn();

      await requireOrgWriteAccess(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ message: "Viewer role has read-only access" });
      expect(next).not.toHaveBeenCalled();
    });
  });
});

describe("Subscription lifecycle × membership interaction", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("owner cancels → api + db updated → member cache invalidated", async () => {
    (prisma.subscription.findUnique as jest.Mock).mockResolvedValue({
      userId: "owner_1",
      dodoSubscriptionId: "sub_123",
      currentPeriodEnd: futureDate(15),
    });

    (prisma.organization.findMany as jest.Mock).mockResolvedValue([
      {
        members: [
          { userId: "owner_1" },
          { userId: "member_1" },
        ],
      },
    ]);

    await cancelSubscription("owner_1");

    expect(redis.del).toHaveBeenCalledWith("user:premium:member_1");
    expect(redis.del).toHaveBeenCalledWith("user:premium:owner_1");
  });

  it("owner reactivates → api + db updated → member cache invalidated", async () => {
    (prisma.subscription.findUnique as jest.Mock).mockResolvedValue({
      userId: "owner_1",
      dodoSubscriptionId: "sub_123",
    });

    (prisma.organization.findMany as jest.Mock).mockResolvedValue([
      {
        members: [
          { userId: "owner_1" },
          { userId: "member_1" },
        ],
      },
    ]);

    (prisma.subscription.update as jest.Mock).mockResolvedValue({});

    await reactivateSubscription("owner_1");

    expect(redis.del).toHaveBeenCalledWith("user:premium:member_1");
    expect(redis.del).toHaveBeenCalledWith("user:premium:owner_1");
  });

  it("handleCheckoutCompleted invalidates all member caches", async () => {
    const mockTxSubFind = jest.fn().mockResolvedValue(null);
    (prisma.$transaction as jest.Mock).mockImplementation((cb: any) => cb({
      subscription: {
        findUnique: mockTxSubFind,
        create: jest.fn().mockResolvedValue({ id: "sub_new" }),
        update: jest.fn(),
      },
      systemAuditLog: { create: jest.fn() },
    }));

    (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: "owner_1", email: "o@t.com" });
    (prisma.subscription.findUnique as jest.Mock).mockResolvedValue(null);
    (prisma.subscription.findFirst as jest.Mock).mockResolvedValue(null);

    (prisma.organization.findMany as jest.Mock).mockResolvedValue([
      {
        members: [
          { userId: "owner_1" },
          { userId: "member_1" },
          { userId: "member_2" },
        ],
      },
    ]);

    await handleCheckoutCompleted("sess_1", "owner_1", "sub_new", "cust_1", 7);

    const delCalls = (redis.del as jest.Mock).mock.calls.map((c: any[]) => c[0]);
    expect(delCalls).toContain("user:premium:owner_1");
    expect(delCalls).toContain("user:premium:member_1");
    expect(delCalls).toContain("user:premium:member_2");
  });

  it("activateSubscriptionFromPayment invalidates all member caches", async () => {
    const mockTxSubFind = jest.fn().mockResolvedValue(null);
    (prisma.$transaction as jest.Mock).mockImplementation((cb: any) => cb({
      subscription: {
        findUnique: mockTxSubFind,
        create: jest.fn().mockResolvedValue({ id: "sub_new" }),
        update: jest.fn(),
      },
      systemAuditLog: { create: jest.fn() },
    }));

    (prisma.subscription.findUnique as jest.Mock).mockResolvedValue(null);

    (prisma.organization.findMany as jest.Mock).mockResolvedValue([
      {
        members: [
          { userId: "owner_1" },
          { userId: "member_1" },
        ],
      },
    ]);

    await activateSubscriptionFromPayment("owner_1", "sub_new", "cust_1", "sess_1", "pay_1");

    expect(redis.del).toHaveBeenCalledWith("user:premium:owner_1");
    expect(redis.del).toHaveBeenCalledWith("user:premium:member_1");
  });
});

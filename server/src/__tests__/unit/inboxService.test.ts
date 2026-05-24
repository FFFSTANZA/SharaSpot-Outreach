process.env.ENCRYPTION_KEY =
  "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";

jest.mock("../../config/prisma", () => ({
  prisma: {
    sender: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
    },
    inboxEmail: {
      upsert: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
      findUnique: jest.fn(),
      updateMany: jest.fn(),
    },
    inboxThread: {
      findMany: jest.fn(),
      count: jest.fn(),
      updateMany: jest.fn(),
    },
    inboxSyncJob: {
      create: jest.fn(),
      update: jest.fn(),
    },
  },
}));

jest.mock("../../utils/encryption", () => ({
  decrypt: jest.fn().mockReturnValue("decrypted-password"),
}));

jest.mock("nodemailer", () => ({
  createTransport: jest.fn().mockReturnValue({
    sendMail: jest.fn().mockResolvedValue({ messageId: "<test-123@local>" }),
    close: jest.fn(),
  }),
}));

jest.mock("imap", () => {
  return jest.fn().mockImplementation(() => ({
    once: jest.fn().mockImplementation(function(this: any, event: string, cb: Function) {
      if (event === "ready") cb();
    }),
    openBox: jest.fn().mockImplementation(function(cb: Function) {
      cb(null, { exists: 10 });
    }),
    search: jest.fn().mockImplementation(function(cb: Function) {
      cb(null, [1, 2, 3]);
    }),
    fetch: jest.fn().mockImplementation(() => {
      return {
        on: jest.fn(),
        once: jest.fn().mockImplementation(function(this: any, event: string, cb: Function) {
          if (event === "end") cb();
        }),
      };
    }),
    end: jest.fn(),
  }));
});

jest.mock("mailparser", () => ({
  simpleParser: jest.fn().mockResolvedValue({
    messageId: "<test-msg-123@local>",
    inReplyTo: null,
    references: null,
    threadId: null,
    from: { value: [{ name: "Test User", address: "test@example.com" }] },
    to: { value: [{ name: "Recipient", address: "recipient@example.com" }] },
    subject: "Test Email",
    date: new Date(),
    text: "Test body content",
  }),
}));

import { prisma } from "../../config/prisma";
import { syncInboxForSender, sendInboxReply, getInboxEmails, getInboxThreads, markInboxEmailRead, toggleInboxEmailStar } from "../../utils/inboxService";
import { decrypt } from "../../utils/encryption";

function mockReqRes(body: any = {}, user: any = { id: "user-123" }) {
  const req = { body, user, params: {}, query: {} } as any;
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  } as any;
  return { req, res };
}

describe("InboxService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("syncInboxForSender", () => {
    it("should initiate sync for a single sender via IMAP", async () => {
      const mockSender = {
        id: "sender-1",
        userId: "user-123",
        email: "test@gmail.com",
        appPassword: "encrypted-password",
        smtpHost: "smtp.gmail.com",
        smtpPort: 465,
        connectionType: "IMAP",
        isVerified: true,
      };

      (prisma.sender.findUnique as jest.Mock).mockResolvedValue(mockSender);

      const result = await syncInboxForSender("sender-1");

      expect(prisma.sender.findUnique).toHaveBeenCalledWith({
        where: { id: "sender-1" },
        include: { user: true },
      });
      expect(result.synced).toBeDefined();
    });

    it("should return error when sender not found", async () => {
      (prisma.sender.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await syncInboxForSender("non-existent");

      expect(result.synced).toBe(0);
      expect(result.errors).toContain("Sender not found");
    });

    it("should handle multiple accounts independently", async () => {
      const sender1 = {
        id: "sender-1",
        userId: "user-123",
        email: "account1@gmail.com",
        appPassword: "enc1",
        smtpHost: "smtp.gmail.com",
        smtpPort: 465,
        connectionType: "IMAP",
        isVerified: true,
      };

      const sender2 = {
        id: "sender-2",
        userId: "user-123",
        email: "account2@outlook.com",
        appPassword: "enc2",
        smtpHost: "smtp.office365.com",
        smtpPort: 465,
        connectionType: "IMAP",
        isVerified: true,
      };

      (prisma.sender.findUnique as jest.Mock).mockImplementation((args) => {
        if (args.where.id === "sender-1") return Promise.resolve(sender1);
        if (args.where.id === "sender-2") return Promise.resolve(sender2);
        return Promise.resolve(null);
      });

      (prisma.inboxEmail.upsert as jest.Mock).mockResolvedValue({ id: "email-1" });
      (prisma.inboxThread.updateMany as jest.Mock).mockResolvedValue({ count: 1 });

      await syncInboxForSender("sender-1");
      await syncInboxForSender("sender-2");

      expect(prisma.sender.findUnique).toHaveBeenCalledTimes(2);
    });
  });

  describe("sendInboxReply", () => {
    it("should send reply via SMTP", async () => {
      const mockSender = {
        id: "sender-1",
        userId: "user-123",
        email: "test@gmail.com",
        appPassword: "encrypted",
        smtpHost: "smtp.gmail.com",
        smtpPort: 465,
      };

      (prisma.sender.findUnique as jest.Mock).mockResolvedValue(mockSender);
      (decrypt as jest.Mock).mockReturnValue("decrypted-password");

      const result = await sendInboxReply(
        "sender-1",
        "recipient@example.com",
        "Re: Test",
        "Thank you for your email!"
      );

      expect(result.success).toBe(true);
      expect(result.messageId).toBeDefined();
    });

    it("should return error when sender not found", async () => {
      (prisma.sender.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await sendInboxReply(
        "non-existent",
        "recipient@example.com",
        "Test",
        "Body"
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe("Sender not found");
    });
  });

  describe("getInboxEmails", () => {
    it("should fetch emails for a sender", async () => {
      const mockEmails = [
        { id: "email-1", subject: "Test 1", fromEmail: "sender@test.com", isRead: false },
        { id: "email-2", subject: "Test 2", fromEmail: "sender@test.com", isRead: true },
      ];

      (prisma.inboxEmail.findMany as jest.Mock).mockResolvedValue(mockEmails);
      (prisma.inboxEmail.count as jest.Mock).mockResolvedValue(2);

      const result = await getInboxEmails("sender-1", { page: 1, limit: 20 });

      expect(result.emails).toHaveLength(2);
      expect(result.total).toBe(2);
    });

    it("should filter by folder", async () => {
      (prisma.inboxEmail.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.inboxEmail.count as jest.Mock).mockResolvedValue(0);

      await getInboxEmails("sender-1", { folder: "SENT", page: 1, limit: 20 });

      expect(prisma.inboxEmail.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            folder: "SENT",
          }),
        })
      );
    });
  });

  describe("getInboxThreads", () => {
    it("should fetch threads for a sender", async () => {
      const mockEmails = [
        {
          id: "email-1",
          senderId: "sender-1",
          threadId: "thr-1",
          fromEmail: "prospect-1@acme.com",
          toEmail: "owner@team.com",
          subject: "Thread 1",
          snippet: "A",
          bodyText: "A",
          isRead: false,
          isStarred: false,
          isArchived: false,
          receivedAt: new Date("2026-01-01T10:00:00.000Z"),
        },
        {
          id: "email-2",
          senderId: "sender-1",
          threadId: "thr-2",
          fromEmail: "prospect-2@acme.com",
          toEmail: "owner@team.com",
          subject: "Thread 2",
          snippet: "B",
          bodyText: "B",
          isRead: true,
          isStarred: true,
          isArchived: false,
          receivedAt: new Date("2026-01-01T09:00:00.000Z"),
        },
      ];

      (prisma.inboxEmail.findMany as jest.Mock).mockResolvedValue(mockEmails);

      const result = await getInboxThreads("sender-1", { page: 1, limit: 20 });

      expect(result.threads).toHaveLength(2);
      expect(result.total).toBe(2);
    });
  });

  describe("markInboxEmailRead", () => {
    it("should mark email as read", async () => {
      (prisma.inboxEmail.update as jest.Mock).mockResolvedValue({ id: "email-1", isRead: true });

      await markInboxEmailRead("email-1");

      expect(prisma.inboxEmail.update).toHaveBeenCalledWith({
        where: { id: "email-1" },
        data: { isRead: true },
      });
    });
  });

  describe("toggleInboxEmailStar", () => {
    it("should toggle star status", async () => {
      (prisma.inboxEmail.findUnique as jest.Mock).mockResolvedValue({
        id: "email-1",
        isStarred: false,
      });
      (prisma.inboxEmail.update as jest.Mock).mockResolvedValue({ id: "email-1", isStarred: true });

      const result = await toggleInboxEmailStar("email-1");

      expect(result).toBe(true);
    });
  });
});

describe("Multi-Account Inbox Sync", () => {
  it("should fetch emails for each sender with correct senderId filter", async () => {
    const sender1Emails = [
      { id: "e1", senderId: "sender-1", fromEmail: "recruiter1@company.com", subject: "Job Offer" },
      { id: "e2", senderId: "sender-1", fromEmail: "recruiter2@company.com", subject: "Interview" },
    ];

    const sender2Emails = [
      { id: "e3", senderId: "sender-2", fromEmail: "hr@company.com", subject: "Welcome" },
    ];

    (prisma.inboxEmail.findMany as jest.Mock).mockImplementation(({ where }) => {
      if (where.senderId === "sender-1") return Promise.resolve(sender1Emails);
      if (where.senderId === "sender-2") return Promise.resolve(sender2Emails);
      return Promise.resolve([]);
    });
    (prisma.inboxEmail.count as jest.Mock).mockImplementation(({ where }) => {
      if (where.senderId === "sender-1") return Promise.resolve(2);
      if (where.senderId === "sender-2") return Promise.resolve(1);
      return Promise.resolve(0);
    });

    const result1 = await getInboxEmails("sender-1");
    const result2 = await getInboxEmails("sender-2");

    expect(result1.emails).toHaveLength(2);
    expect(result1.emails[0].senderId).toBe("sender-1");
    expect(result2.emails).toHaveLength(1);
    expect(result2.emails[0].senderId).toBe("sender-2");
  });

  it("should keep emails separate between sender accounts", async () => {
    jest.clearAllMocks();

    const sender1Email = { id: "e1", senderId: "sender-1", fromEmail: " recruiter1@corp.com" };
    const sender2Email = { id: "e2", senderId: "sender-2", fromEmail: "recruiter2@corp.com" };

    (prisma.inboxEmail.findMany as jest.Mock)
      .mockResolvedValueOnce([sender1Email])
      .mockResolvedValueOnce([sender2Email]);
    (prisma.inboxEmail.count as jest.Mock)
      .mockResolvedValueOnce(1)
      .mockResolvedValueOnce(1);

    const result1 = await getInboxEmails("sender-1");
    const result2 = await getInboxEmails("sender-2");

    expect(prisma.inboxEmail.findMany).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ where: expect.objectContaining({ senderId: "sender-1" }) })
    );
    expect(prisma.inboxEmail.findMany).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ where: expect.objectContaining({ senderId: "sender-2" }) })
    );
  });

  it("should query each sender their own inbox independently", async () => {
    jest.clearAllMocks();

    (prisma.inboxEmail.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.inboxEmail.count as jest.Mock).mockResolvedValue(0);

    await getInboxEmails("sender-account-1");
    await getInboxEmails("sender-account-2");
    await getInboxEmails("sender-account-3");

    expect(prisma.inboxEmail.findMany).toHaveBeenCalledTimes(3);
    expect(prisma.inboxEmail.count).toHaveBeenCalledTimes(3);

    const calls = (prisma.inboxEmail.findMany as jest.Mock).mock.calls;
    const senderIds = calls.map((call: any[]) => call[0]?.where?.senderId);
    
    expect(senderIds).toContain("sender-account-1");
    expect(senderIds).toContain("sender-account-2");
    expect(senderIds).toContain("sender-account-3");
  });
});

describe("Inbox API Controllers", () => {
  it("should get emails for default sender when none specified", async () => {
    const { getInboxEmails: getEmailsController } = require("../../controllers/inboxControllers");

    const senders = [{ id: "default-sender" }];
    (prisma.sender.findMany as jest.Mock).mockResolvedValue(senders);
    (prisma.inboxEmail.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.inboxEmail.count as jest.Mock).mockResolvedValue(0);

    const { req, res } = mockReqRes({}, { id: "user-123" });

    await getEmailsController(req as any, res as any);

    expect(prisma.sender.findMany).toHaveBeenCalledWith({
      where: { userId: "user-123" },
      select: { id: true },
      take: 1,
    });
  });
});

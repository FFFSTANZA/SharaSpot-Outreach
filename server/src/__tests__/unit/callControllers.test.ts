process.env.ENCRYPTION_KEY =
  "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";

const txMock = {
  callTask: {
    findFirst: jest.fn(),
    update: jest.fn(),
    create: jest.fn(),
  },
  contact: {
    update: jest.fn(),
  },
  callSession: {
    findFirst: jest.fn(),
    update: jest.fn(),
    create: jest.fn(),
  },
  contactActivity: {
    create: jest.fn(),
  },
};

jest.mock("../../config/prisma", () => ({
  prisma: {
    contact: {
      findFirst: jest.fn(),
    },
    callSession: {
      findFirst: jest.fn(),
      update: jest.fn(),
      create: jest.fn(),
    },
    $transaction: jest.fn(async (cb: any) => cb(txMock)),
  },
}));

jest.mock("../../utils/contactService", () => ({
  logContactActivity: jest.fn(),
}));

import { prisma } from "../../config/prisma";
import { logCall, submitCallDisposition } from "../../controllers/callControllers";

const mockReqRes = (body: any = {}, user: any = { id: "u1", email: "u1@example.com" }) => {
  const req = { body, user } as any;
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  } as any;
  return { req, res };
};

describe("callControllers integration integrity", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    txMock.callTask.findFirst.mockReset();
    txMock.callTask.update.mockReset();
    txMock.callTask.create.mockReset();
    txMock.contact.update.mockReset();
    txMock.callSession.findFirst.mockReset();
    txMock.callSession.update.mockReset();
    txMock.callSession.create.mockReset();
    txMock.contactActivity.create.mockReset();

    (prisma.contact.findFirst as jest.Mock).mockResolvedValue({ id: "c1", stage: "COLD", phone: "+123" });
    txMock.contactActivity.create.mockResolvedValue({ id: "a1" });
    txMock.callTask.create.mockResolvedValue({ id: "follow1" });
    txMock.callSession.create.mockResolvedValue({ id: "sess-new" });
    txMock.callTask.update.mockResolvedValue({ id: "t1" });
    txMock.callSession.update.mockResolvedValue({ id: "sess1" });
  });

  it("does not create a second call session when disposition is submitted with sessionId", async () => {
    txMock.callTask.findFirst.mockResolvedValue({ id: "t1", status: "PENDING" });
    txMock.callSession.findFirst.mockResolvedValue({
      id: "sess1",
      contactId: "c1",
      taskId: "t1",
      startedAt: new Date(Date.now() - 60_000),
      metadata: {},
      durationSeconds: null,
      endedAt: null,
    });

    const { req, res } = mockReqRes({
      sessionId: "sess1",
      taskId: "t1",
      contactId: "c1",
      outcome: "CONNECTED",
      nextAction: "CALL_BACK",
    });

    await submitCallDisposition(req, res);

    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    expect(txMock.callSession.update).toHaveBeenCalledTimes(1);
    expect(txMock.callSession.create).toHaveBeenCalledTimes(0);
  });

  it("rejects session/contact mismatch", async () => {
    txMock.callTask.findFirst.mockResolvedValue({ id: "t1", status: "PENDING" });
    txMock.callSession.findFirst.mockResolvedValue({
      id: "sess1",
      contactId: "other-contact",
      taskId: "t1",
      startedAt: new Date(Date.now() - 60_000),
      metadata: {},
      durationSeconds: null,
      endedAt: null,
    });

    const { req, res } = mockReqRes({
      sessionId: "sess1",
      taskId: "t1",
      contactId: "c1",
      outcome: "CONNECTED",
      nextAction: "CALL_BACK",
    });

    await submitCallDisposition(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: "Session/contact mismatch" }));
  });

  it("returns 404 when taskId is provided but not found for contact", async () => {
    txMock.callTask.findFirst.mockResolvedValue(null);

    const { req, res } = mockReqRes({
      taskId: "missing-task",
      contactId: "c1",
      outcome: "CONNECTED",
      nextAction: "CALL_BACK",
    });

    await logCall(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: "Call task not found for contact" }));
  });

  it("returns 409 when disposition is submitted for non-pending task", async () => {
    txMock.callTask.findFirst.mockResolvedValue({ id: "t1", status: "COMPLETED" });

    const { req, res } = mockReqRes({
      taskId: "t1",
      contactId: "c1",
      outcome: "CONNECTED",
      nextAction: "CALL_BACK",
    });

    await logCall(req, res);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: "Call task is already closed" }));
  });
});

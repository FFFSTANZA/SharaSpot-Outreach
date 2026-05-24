jest.mock("../../config/prisma", () => ({
  prisma: {
    contact: { findMany: jest.fn() },
    contactList: { findFirst: jest.fn() },
    tag: { findFirst: jest.fn() },
    $transaction: jest.fn(async (cb: any) => cb({
      contact: { updateMany: jest.fn(), update: jest.fn() },
      contactList: { update: jest.fn() },
      prmBulkActionLog: { create: jest.fn() },
    })),
  },
}));

jest.mock("../../utils/contactService", () => ({
  logContactActivity: jest.fn(),
}));

import { prisma } from "../../config/prisma";
import { executePrmBulkAction } from "../../controllers/prmControllers";

const mockReqRes = (body: any = {}, user: any = { id: "u1", email: "u1@example.com" }) => {
  const req = { body, user, params: {}, query: {} } as any;
  const res = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() } as any;
  return { req, res };
};

describe("prmControllers bulk action validation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (prisma.contact.findMany as jest.Mock).mockResolvedValue([{ id: "c1", stage: "COLD", tags: [], lists: [] }]);
  });

  it("rejects add_tag when tag is not owned by user", async () => {
    (prisma.tag.findFirst as jest.Mock).mockResolvedValue(null);

    const { req, res } = mockReqRes({ actionType: "add_tag", contactIds: ["c1"], tagId: "t-foreign" });
    await executePrmBulkAction(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: "Tag not found" }));
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it("rejects remove_tag when tag is not owned by user", async () => {
    (prisma.tag.findFirst as jest.Mock).mockResolvedValue(null);

    const { req, res } = mockReqRes({ actionType: "remove_tag", contactIds: ["c1"], tagId: "t-foreign" });
    await executePrmBulkAction(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: "Tag not found" }));
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it("rejects update_stage when stage is invalid", async () => {
    const { req, res } = mockReqRes({ actionType: "update_stage", contactIds: ["c1"], stage: "INVALID_STAGE" });
    await executePrmBulkAction(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: "Invalid stage value" }));
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it("returns 404 when no owned contacts are found for bulk action", async () => {
    (prisma.contact.findMany as jest.Mock).mockResolvedValue([]);

    const { req, res } = mockReqRes({ actionType: "update_stage", contactIds: ["missing-1"], stage: "WARM" });
    await executePrmBulkAction(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: "No valid contacts found for bulk action" }));
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });
});

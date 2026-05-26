jest.mock("../../config/prisma", () => ({
  prisma: {
    followUpTemplate: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

import {
  createFollowUpTemplate,
  listFollowUpTemplates,
  getFollowUpTemplateById,
  updateFollowUpTemplate,
  deleteFollowUpTemplate,
} from "../../controllers/followUpTemplateControllers";
import { prisma } from "../../config/prisma";
const mockedPrisma = prisma as any;

function mockReqRes(body: any = {}, params: any = {}) {
  const req = { body, params, user: { id: "user-1", activeOrganizationId: null } } as any;
  const res = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() } as any;
  return { req, res };
}

describe("followUpTemplateControllers", () => {
  beforeEach(() => jest.clearAllMocks());

  it("creates template", async () => {
    (mockedPrisma.followUpTemplate.create as jest.Mock).mockResolvedValue({ id: "f1", name: "n", steps: [] });
    const { req, res } = mockReqRes({ name: "n", steps: [] });
    await createFollowUpTemplate(req, res);
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it("lists templates", async () => {
    (mockedPrisma.followUpTemplate.findMany as jest.Mock).mockResolvedValue([{ id: "f1" }]);
    const { req, res } = mockReqRes();
    await listFollowUpTemplates(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it("gets template by id", async () => {
    (mockedPrisma.followUpTemplate.findFirst as jest.Mock).mockResolvedValue({ id: "f1" });
    const { req, res } = mockReqRes({}, { id: "f1" });
    await getFollowUpTemplateById(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it("updates template", async () => {
    (mockedPrisma.followUpTemplate.findFirst as jest.Mock).mockResolvedValue({ id: "f1" });
    (mockedPrisma.followUpTemplate.update as jest.Mock).mockResolvedValue({ id: "f1", name: "new" });
    const { req, res } = mockReqRes({ name: "new", steps: [] }, { id: "f1" });
    await updateFollowUpTemplate(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it("deletes template", async () => {
    (mockedPrisma.followUpTemplate.findFirst as jest.Mock).mockResolvedValue({ id: "f1" });
    (mockedPrisma.followUpTemplate.delete as jest.Mock).mockResolvedValue({});
    const { req, res } = mockReqRes({}, { id: "f1" });
    await deleteFollowUpTemplate(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
  });
});

jest.mock("../../utils/jwt", () => ({
  verifyAccessToken: jest.fn(),
}));

import { Request, Response, NextFunction } from "express";
import { authMiddleware } from "../../middlewares/authMiddleware";
import { verifyAccessToken } from "../../utils/jwt";

const mockVerifyToken = verifyAccessToken as jest.Mock;

function mockReqRes() {
  const req = { headers: {} } as unknown as Request;
  const res = { status: jest.fn().mockReturnThis(), json: jest.fn() } as unknown as Response;
  const next = jest.fn() as NextFunction;
  return { req, res, next };
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe("authMiddleware", () => {
  it("returns 401 if no Authorization header", async () => {
    const { req, res, next } = mockReqRes();
    await authMiddleware(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it("returns 401 if Authorization header is malformed", async () => {
    const { req, res, next } = mockReqRes();
    req.headers.authorization = "NotBearer token123";
    await authMiddleware(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it("returns 401 if token verification fails", async () => {
    const { req, res, next } = mockReqRes();
    req.headers.authorization = "Bearer invalid-token";
    mockVerifyToken.mockImplementation(() => { throw new Error("jwt malformed"); });
    await authMiddleware(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it("sets req.user with id and email from decoded token", async () => {
    const { req, res, next } = mockReqRes();
    req.headers.authorization = "Bearer valid-token";
    mockVerifyToken.mockReturnValue({ id: "user-1", email: "test@test.com" });
    await authMiddleware(req, res, next);
    expect(req.user).toEqual({ id: "user-1", email: "test@test.com" });
    expect(next).toHaveBeenCalled();
  });

  it("handles token extraction with Bearer prefix", async () => {
    const { req, res, next } = mockReqRes();
    req.headers.authorization = "Bearer token-here";
    mockVerifyToken.mockReturnValue({ id: "user-2", email: "a@b.com" });
    await authMiddleware(req, res, next);
    expect(mockVerifyToken).toHaveBeenCalledWith("token-here");
  });
});

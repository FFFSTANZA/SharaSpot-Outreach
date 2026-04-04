/**
 * R2 Config Tests — Unit
 *
 * The R2 config module reads R2_ACCOUNT_ID, R2_ACCESS_KEY_ID,
 * R2_SECRET_ACCESS_KEY, and R2_BUCKET_NAME from process.env at import time.
 * It logs a warning for each missing variable and exports the r2Client.
 */

// Mock @aws-sdk/client-s3 before importing the config module
jest.mock("@aws-sdk/client-s3", () => ({
  S3Client: jest.fn().mockImplementation(() => ({
    send: jest.fn(),
  })),
  PutObjectCommand: jest.fn(),
  DeleteObjectCommand: jest.fn(),
}));

describe("R2 Config", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it("logs warnings when env vars are missing", () => {
    delete process.env.R2_ACCOUNT_ID;
    delete process.env.R2_ACCESS_KEY_ID;
    delete process.env.R2_SECRET_ACCESS_KEY;
    // R2_BUCKET_NAME has a default, so we don't necessarily need to check its warning if it's not implemented that way

    const warnSpy = jest.spyOn(console, "warn").mockImplementation();
    require("../../config/r2");

    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining("R2_ACCOUNT_ID"));
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining("R2_ACCESS_KEY_ID"));
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining("R2_SECRET_ACCESS_KEY"));
    warnSpy.mockRestore();
  });

  it("does not log warnings when all env vars are set", () => {
    process.env.R2_ACCOUNT_ID = "test-account";
    process.env.R2_ACCESS_KEY_ID = "test-key";
    process.env.R2_SECRET_ACCESS_KEY = "test-secret";
    process.env.R2_BUCKET_NAME = "test-bucket";

    const warnSpy = jest.spyOn(console, "warn").mockImplementation();
    require("../../config/r2");

    expect(warnSpy).not.toHaveBeenCalled();
    warnSpy.mockRestore();
  });

  it("initializes S3Client with correct values", () => {
    process.env.R2_ACCOUNT_ID = "my-account";
    process.env.R2_ACCESS_KEY_ID = "my-key";
    process.env.R2_SECRET_ACCESS_KEY = "my-secret";

    const { S3Client } = require("@aws-sdk/client-s3");
    require("../../config/r2");

    expect(S3Client).toHaveBeenCalledWith({
      region: "auto",
      endpoint: "https://my-account.r2.cloudflarestorage.com",
      credentials: {
        accessKeyId: "my-key",
        secretAccessKey: "my-secret",
      },
    });
  });
});

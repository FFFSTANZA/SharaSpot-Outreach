import {
  classifySmtpError,
  inferProviderKeyFromHost,
  resolveProviderSmtp,
} from "../../utils/senderProvider";

describe("senderProvider utils", () => {
  it("uses provider defaults when host/port omitted", () => {
    const resolved = resolveProviderSmtp("outlook", undefined, undefined);
    expect(resolved.smtpHost).toBe("smtp.office365.com");
    expect(resolved.smtpPort).toBe(587);
  });

  it("preserves explicit host/port for custom and legacy payloads", () => {
    const resolved = resolveProviderSmtp(undefined, "smtp.custom.io", 2525);
    expect(resolved.smtpHost).toBe("smtp.custom.io");
    expect(resolved.smtpPort).toBe(2525);
  });

  it("infers provider key from host", () => {
    expect(inferProviderKeyFromHost("smtp.gmail.com")).toBe("gmail");
    expect(inferProviderKeyFromHost("smtp.office365.com")).toBe("outlook");
    expect(inferProviderKeyFromHost("smtp.zoho.com")).toBe("zoho");
    expect(inferProviderKeyFromHost("smtp.mail.yahoo.com")).toBe("yahoo");
    expect(inferProviderKeyFromHost("mail.company.local")).toBe("custom");
  });

  it("classifies auth errors", () => {
    const message = classifySmtpError({ code: "EAUTH", message: "Invalid login" });
    expect(message.toLowerCase()).toContain("authentication failed");
  });

  it("classifies timeout errors", () => {
    const message = classifySmtpError({ code: "ETIMEDOUT", message: "timeout" });
    expect(message.toLowerCase()).toContain("timeout");
  });

  it("classifies host/port mismatch errors", () => {
    const message = classifySmtpError({ code: "ECONNREFUSED", message: "connect ECONNREFUSED" });
    expect(message.toLowerCase()).toContain("host/port mismatch");
  });
});

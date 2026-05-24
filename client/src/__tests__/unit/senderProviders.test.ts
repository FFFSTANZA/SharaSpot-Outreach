import {
  getConnectionSecurityHint,
  getProviderConfig,
  inferProviderFromHost,
} from "@/lib/senderProviders";

describe("sender provider helpers", () => {
  it("returns provider defaults for known providers", () => {
    const outlook = getProviderConfig("outlook");
    expect(outlook.smtpHost).toBe("smtp.office365.com");
    expect(outlook.smtpPort).toBe(587);
  });

  it("infers provider from smtp host", () => {
    expect(inferProviderFromHost("smtp.gmail.com")).toBe("gmail");
    expect(inferProviderFromHost("smtp.office365.com")).toBe("outlook");
    expect(inferProviderFromHost("smtp.zoho.eu")).toBe("zoho");
    expect(inferProviderFromHost("smtp.mail.yahoo.com")).toBe("yahoo");
    expect(inferProviderFromHost("smtp.company.internal")).toBe("custom");
  });

  it("returns security hint by port convention", () => {
    expect(getConnectionSecurityHint(465)).toContain("SSL");
    expect(getConnectionSecurityHint(587)).toContain("STARTTLS");
  });
});

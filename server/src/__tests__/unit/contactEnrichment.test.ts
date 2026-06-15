import {
  detectTechStack,
  enrichContactInput,
  extractCompanyNameFromHtml,
  extractEmailsFromHtml,
  extractPhoneFromHtml,
} from "../../utils/contactEnrichment";
import { validateEmail } from "../../utils/emailValidator";

jest.mock("../../utils/emailValidator", () => ({
  validateEmail: jest.fn(),
}));

describe("contactEnrichment", () => {
  const validateEmailMock = validateEmail as jest.MockedFunction<typeof validateEmail>;
  const originalFetch = global.fetch;

  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
  });

  afterAll(() => {
    global.fetch = originalFetch;
  });

  it("extracts direct, mailto, and obfuscated emails", () => {
    const html = `
      <a href="mailto:founder@example.com">Email</a>
      <span>sales [at] example [dot] com</span>
      <script>var hidden = "team&#64;example.com";</script>
    `;

    expect(extractEmailsFromHtml(html)).toEqual([
      "founder@example.com",
      "sales@example.com",
      "team@example.com",
    ]);
  });

  it("detects common web technologies from page source", () => {
    const html = `
      <script src="/_next/static/chunks/main.js"></script>
      <script src="https://js.stripe.com/v3"></script>
      <script>window.intercomSettings = { app_id: "abc" };</script>
    `;

    expect(detectTechStack(html, "https://acme.com")).toEqual(
      expect.arrayContaining(["Next.js", "Stripe", "Intercom"])
    );
  });

  it("extracts company name and phone from public site markup", () => {
    const html = `
      <html>
        <head>
          <meta property="og:site_name" content="Acme Labs" />
          <title>Acme Labs | Revenue workflows</title>
        </head>
        <body>
          <a href="tel:+1 (415) 555-0123">Call us</a>
        </body>
      </html>
    `;

    expect(extractCompanyNameFromHtml(html, "acme.com")).toBe("Acme Labs");
    expect(extractPhoneFromHtml(html)).toBe("+1 (415) 555-0123");
  });

  it("extracts company and phone from json-ld when available", () => {
    const html = `
      <script type="application/ld+json">
        {
          "@context": "https://schema.org",
          "@type": "Organization",
          "name": "Schema Labs",
          "telephone": "+1 646 555 0101"
        }
      </script>
    `;

    expect(extractCompanyNameFromHtml(html, "schema.com")).toBe("Schema Labs");
    expect(extractPhoneFromHtml(html)).toBe("+1 646 555 0101");
  });

  it("can generate and validate probable work emails from name and domain", async () => {
    validateEmailMock.mockImplementation(async (email: string) => ({
      email,
      valid: email === "jane.doe@example.com",
      score: email === "jane.doe@example.com" ? 8 : 50,
      level: email === "jane.doe@example.com" ? "low" : "medium",
      issues: [],
      checks: {
        syntax: true,
        mx: true,
        disposable: false,
        free: false,
        roleBased: false,
        catchAll: false,
        hasSPF: true,
        hasDMARC: true,
      },
      isFreeEmail: false,
      isCorporateEmail: true,
      isCatchAll: false,
      riskScore: email === "jane.doe@example.com" ? 8 : 50,
      riskLevel: email === "jane.doe@example.com" ? "low" : "medium",
    }));

    (global.fetch as jest.Mock).mockResolvedValue({ ok: false, url: "https://example.com/404", headers: { get: () => null }, text: async () => "" });

    const result = await enrichContactInput({
      companyDomain: "example.com",
      firstName: "Jane",
      lastName: "Doe",
    });

    expect(result.email).toBe("jane.doe@example.com");
    expect(result.validation?.email).toBe("jane.doe@example.com");
  });

  it("discovers an email from website pages and reuses validation", async () => {
    validateEmailMock.mockImplementation(async (email: string) => ({
      email,
      valid: email === "jane@example.com",
      score: email === "jane@example.com" ? 10 : 45,
      level: email === "jane@example.com" ? "low" : "medium",
      issues: [],
      checks: {
        syntax: true,
        mx: true,
        disposable: false,
        free: false,
        roleBased: false,
        catchAll: false,
        hasSPF: true,
        hasDMARC: true,
      },
      isFreeEmail: false,
      isCorporateEmail: true,
      isCatchAll: false,
      riskScore: email === "jane@example.com" ? 10 : 45,
      riskLevel: email === "jane@example.com" ? "low" : "medium",
    }));

    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        url: "https://example.com",
        headers: { get: () => "text/html" },
        text: async () => `
          <meta property="og:site_name" content="Example Inc" />
          <script src="/_next/static/chunks/main.js"></script>
          <a href="mailto:hello@example.com">hello</a>
          <a href="tel:+1 212 555 0100">call</a>
        `,
      })
      .mockResolvedValueOnce({
        ok: true,
        url: "https://example.com/contact",
        headers: { get: () => "text/html" },
        text: async () => `<div>jane [at] example [dot] com</div>`,
      })
      .mockResolvedValue({ ok: false, url: "https://example.com/404", headers: { get: () => null }, text: async () => "" });

    const result = await enrichContactInput({
      website: "example.com",
      firstName: "Jane",
      lastName: "Doe",
    });

    expect(result.email).toBe("jane@example.com");
    expect(result.companyDomain).toBe("example.com");
    expect(result.company).toBe("Example Inc");
    expect(result.phone).toBe("+1 212 555 0100");
    expect(result.discoveredEmails).toEqual(["hello@example.com", "jane@example.com"]);
    expect(result.techStack).toContain("Next.js");
    expect(result.validation?.email).toBe("jane@example.com");
  });
});

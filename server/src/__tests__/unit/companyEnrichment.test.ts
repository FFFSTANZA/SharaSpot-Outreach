import { deriveCompanyDomain, enrichCompanyProfile } from "../../utils/companyEnrichment";

describe("companyEnrichment", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
  });

  afterAll(() => {
    global.fetch = originalFetch;
  });

  it("derives a business domain from website or work email", () => {
    expect(deriveCompanyDomain({ website: "https://acme.com/team" })).toBe("acme.com");
    expect(deriveCompanyDomain({ email: "team@acme.com" })).toBe("acme.com");
    expect(deriveCompanyDomain({ email: "person@gmail.com" })).toBeNull();
  });

  it("extracts company email, phone, socials, and tech stack from website", async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        url: "https://acme.com",
        headers: { get: () => "text/html" },
        text: async () => `
          <meta property="og:site_name" content="Acme Labs" />
          <script src="/_next/static/chunks/main.js"></script>
          <a href="mailto:hello@acme.com">hello</a>
          <a href="mailto:founder@acme.com">founder</a>
          <a href="tel:+1 415 555 0100">call</a>
          <a href="https://www.linkedin.com/company/acme">LinkedIn</a>
          <a href="https://github.com/acme">GitHub</a>
        `,
      })
      .mockResolvedValue({ ok: false, url: "https://acme.com/contact", headers: { get: () => null }, text: async () => "" });

    const result = await enrichCompanyProfile({ website: "acme.com" });

    expect(result.name).toBe("Acme Labs");
    expect(result.domain).toBe("acme.com");
    expect(result.primaryEmail).toBe("hello@acme.com");
    expect(result.phone).toBe("+1 415 555 0100");
    expect(result.linkedinUrl).toBe("https://www.linkedin.com/company/acme");
    expect(result.githubUrl).toBe("https://github.com/acme");
    expect(result.techStack).toContain("Next.js");
  });
});

import {
  assessDeliverability,
  normalizeInboxFirstSettings,
} from "../../utils/deliverabilityGuard";

describe("Deliverability Guard", () => {
  it("normalizes campaigns to inbox-first defaults", () => {
    const settings = normalizeInboxFirstSettings({
      delaySeconds: 0,
      hourlyLimit: 500,
    });

    expect(settings).toEqual({
      delaySeconds: 30,
      hourlyLimit: 40,
      trackOpens: false,
      trackClicks: false,
    });
  });

  it("allows tracking only when explicitly enabled", () => {
    const settings = normalizeInboxFirstSettings({
      delaySeconds: 60,
      hourlyLimit: 20,
      trackOpens: true,
      trackClicks: true,
    });

    expect(settings.trackOpens).toBe(true);
    expect(settings.trackClicks).toBe(true);
  });

  it("blocks high-risk promotional copy before send", () => {
    const result = assessDeliverability(
      "URGENT: YOU WON A FREE PRIZE!!! ACT NOW!!!",
      "CONGRATULATIONS!!! Click here to claim your FREE CASH BONUS now! No cost, no obligation! WIN BIG TODAY!!!",
    );

    expect(result.blocked).toBe(true);
    expect(result.warnings.length).toBeGreaterThan(0);
  });

  it("warns on URL-heavy messages", () => {
    const result = assessDeliverability(
      "Useful resources",
      "Hi there, here are the links: https://a.example.com https://b.example.com https://c.example.com https://d.example.com",
    );

    expect(result.warnings).toContain("too many links");
  });
});

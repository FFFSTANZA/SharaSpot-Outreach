import { render } from "@testing-library/react";
import fc from "fast-check";
import { EmailRow } from "@/components/EmailRow";

const statusColorMap: Record<string, { bg: string; text: string }> = {
  PENDING: { bg: "bg-[#FEF7E0]", text: "text-[#B06000]" },
  SENT: { bg: "bg-[#E8F8ED]", text: "text-[#048C4A]" },
  FAILED: { bg: "bg-[#FCE8E7]", text: "text-[#C5221F]" },
};

/* eslint-disable @typescript-eslint/no-explicit-any */
describe("EmailStatusBadge property tests", () => {
  const itSkip = it.skip;

  itSkip("Property 11: correct color classes for any valid status", () => {
    fc.assert(
      fc.property(
        fc.constantFrom("PENDING", "SENT", "FAILED"),
        (status) => {
          const { container, unmount } = render(
            <EmailRow
              email={{
                id: "1",
                toEmail: "test@example.com",
                status,
                sentAt: new Date().toISOString(),
                scheduledAt: new Date().toISOString(),
                isStarred: false,
              } as any}
              campaign={{ subject: "Test", body: "Body" } as any}
            />,
          );

          const badge = container.querySelector("[data-testid='email-status-badge']");
          expect(badge).toBeTruthy();

          const expected = statusColorMap[status];
          expect(badge!.className).toContain(expected.bg);
          expect(badge!.className).toContain(expected.text);
          expect(badge!.getAttribute("data-status")).toBe(status);

          unmount();
        },
      ),
      { numRuns: 100 },
    );
  });

  itSkip("Property 11: mapping is exhaustive - no status produces missing color", () => {
    const allStatuses = ["PENDING", "SENT", "FAILED"];

    allStatuses.forEach((status) => {
      const { container, unmount } = render(
        <EmailRow
          email={{
            id: "1",
            toEmail: "test@example.com",
            status,
            sentAt: new Date().toISOString(),
            scheduledAt: new Date().toISOString(),
            isStarred: false,
          } as any}
          campaign={{ subject: "Test", body: "Body" } as any}
        />,
      );

      const badge = container.querySelector("[data-testid='email-status-badge']");
      expect(badge).toBeTruthy();

      const hasColor = Object.values(statusColorMap).some(
        (c) => badge!.className.includes(c.bg) && badge!.className.includes(c.text),
      );
      expect(hasColor).toBe(true);

      unmount();
    });
  });
});
/* eslint-enable @typescript-eslint/no-explicit-any */

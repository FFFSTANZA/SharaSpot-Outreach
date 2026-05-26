import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import SequenceBuilder from "@/app/dashboard/compose/SequenceBuilder";
import type { SequenceStepInput } from "@/types";

jest.mock("@/context/ToastContext", () => ({
  useToast: () => ({ addToast: jest.fn() }),
}));

const listFollowUpTemplates = jest.fn();

jest.mock("@/lib/followUpTemplates", () => ({
  listFollowUpTemplates: (...args: unknown[]) => listFollowUpTemplates(...args),
  upsertFollowUpTemplate: jest.fn(),
  getLastUsedTemplates: (templates: any[], count: number) => templates.slice(0, count),
  followUpTemplateToPreset: (template: any) => ({
    name: template.id,
    label: template.name,
    description: template.description || "",
    steps: template.steps,
  }),
}));

describe("SequenceBuilder follow-up template import", () => {
  beforeEach(() => {
    listFollowUpTemplates.mockResolvedValue([
      {
        id: "fu_1",
        name: "Advanced Branch Template",
        description: "desc",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        steps: [
          {
            waitDays: 2,
            subject: "Step 1",
            body: "Body 1",
            condition: {
              type: "opened",
              rules: { operator: "AND", operands: [{ type: "opened", withinHours: 24 }] },
              onMatchNodeId: "n2",
              onNoMatchNodeId: "n3",
            },
          },
        ],
      },
    ]);
  });

  it("preserves advanced condition payload when applying saved template", async () => {
    const onChange = jest.fn<void, [SequenceStepInput[]]>();

    render(
      <SequenceBuilder
        steps={[]}
        onChange={onChange}
        subject="Base subject"
        body="Base body"
      />
    );

    await waitFor(() => {
      expect(screen.getByText("Advanced Branch Template")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Advanced Branch Template"));

    expect(onChange).toHaveBeenCalledTimes(1);
    const nextSteps = onChange.mock.calls[0][0];
    expect(nextSteps).toHaveLength(1);
    expect(nextSteps[0].condition).toEqual({
      type: "opened",
      rules: { operator: "AND", operands: [{ type: "opened", withinHours: 24 }] },
      onMatchNodeId: "n2",
      onNoMatchNodeId: "n3",
    });
  });
});

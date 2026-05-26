import { followUpTemplateToPreset, getLastUsedTemplates } from "@/lib/followUpTemplates";
import type { FollowUpTemplate } from "@/types";

describe("followUpTemplates helpers", () => {
  it("maps follow-up template to sequence preset", () => {
    const template: FollowUpTemplate = {
      id: "f1",
      name: "Template 1",
      description: "Desc",
      steps: [{ waitDays: 2, subject: "S", body: "B" }],
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-02T00:00:00.000Z",
    };

    const preset = followUpTemplateToPreset(template);
    expect(preset.name).toBe("f1");
    expect(preset.label).toBe("Template 1");
    expect(preset.description).toBe("Desc");
    expect(preset.steps).toHaveLength(1);
  });

  it("returns recently updated templates", () => {
    const templates: FollowUpTemplate[] = [
      {
        id: "old",
        name: "Old",
        steps: [],
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z",
      },
      {
        id: "new",
        name: "New",
        steps: [],
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-03T00:00:00.000Z",
      },
    ];

    const recent = getLastUsedTemplates(templates, 1);
    expect(recent).toHaveLength(1);
    expect(recent[0].id).toBe("new");
  });
});

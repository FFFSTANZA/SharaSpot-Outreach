import {
  buildBounceSuppressionListWhere,
  buildBounceSuppressionUniqueWhere,
  upsertBounceSuppression,
} from "../../utils/bounceSuppression";

describe("bounce suppression scoping", () => {
  it("uses user scope for personal workspaces", () => {
    expect(
      buildBounceSuppressionUniqueWhere(
        { userId: "user-1", organizationId: null },
        " Prospect@Example.com ",
      ),
    ).toEqual({
      userId_email: {
        userId: "user-1",
        email: "prospect@example.com",
      },
    });

    expect(
      buildBounceSuppressionListWhere(
        { userId: "user-1", organizationId: null },
        [" Prospect@Example.com "],
      ),
    ).toEqual({
      userId: "user-1",
      organizationId: null,
      email: { in: ["prospect@example.com"] },
    });
  });

  it("uses organization scope for shared workspaces", () => {
    expect(
      buildBounceSuppressionUniqueWhere(
        { userId: "user-1", organizationId: "org-1" },
        " Prospect@Example.com ",
      ),
    ).toEqual({
      organizationId_email: {
        organizationId: "org-1",
        email: "prospect@example.com",
      },
    });

    expect(
      buildBounceSuppressionListWhere(
        { userId: "user-1", organizationId: "org-1" },
        [" Prospect@Example.com "],
      ),
    ).toEqual({
      organizationId: "org-1",
      email: { in: ["prospect@example.com"] },
    });
  });

  it("stores org-scoped bounces without tying them to a single user", async () => {
    const db = {
      bounceList: {
        upsert: jest.fn().mockResolvedValue({ id: "bounce-1" }),
      },
    } as any;

    await upsertBounceSuppression(
      { userId: "user-1", organizationId: "org-1" },
      " Prospect@Example.com ",
      "SMTP bounce",
      db,
    );

    expect(db.bounceList.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          organizationId_email: {
            organizationId: "org-1",
            email: "prospect@example.com",
          },
        },
        create: {
          userId: null,
          organizationId: "org-1",
          email: "prospect@example.com",
          reason: "SMTP bounce",
        },
      }),
    );
  });
});

import { upsertContact } from "../../utils/contactService";

describe("contactService upsertContact", () => {
  it("preserves existing values when new values come only from enrichment", async () => {
    const update = jest.fn(async (args: unknown) => args);
    const create = jest.fn(async (args: unknown) => args);
    const findUnique = jest.fn(async () => ({
      id: "contact_1",
      website: "https://existing.com",
      companyDomain: "existing.com",
      company: "Existing Co",
      phone: "+1 555 100 2000",
      techStack: ["React"],
    }));

    await upsertContact(
      "user_1",
      "hello@existing.com",
      {
        website: "https://enriched.com",
        companyDomain: "enriched.com",
        company: "Enriched Co",
        phone: "+1 555 000 0000",
        techStack: ["Next.js"],
        enrichmentSources: {
          website: "enriched",
          companyDomain: "enriched",
          company: "enriched",
          phone: "enriched",
          techStack: "enriched",
        },
      },
      {
        contact: {
          findUnique,
          update,
          create,
        },
      } as never
    );

    expect(create).not.toHaveBeenCalled();
    expect(update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: "contact_1" },
      data: expect.objectContaining({
        website: "https://existing.com",
        companyDomain: "existing.com",
        company: "Existing Co",
        phone: "+1 555 100 2000",
        techStack: ["React", "Next.js"],
      }),
    }));
  });

  it("allows direct user-provided values to replace existing values", async () => {
    const update = jest.fn(async (args: unknown) => args);
    const findUnique = jest.fn(async () => ({
      id: "contact_1",
      website: "https://old.com",
      companyDomain: "old.com",
      company: "Old Co",
      phone: "+1 555 100 2000",
      techStack: ["React"],
    }));

    await upsertContact(
      "user_1",
      "hello@existing.com",
      {
        website: "https://new.com",
        companyDomain: "new.com",
        company: "New Co",
        phone: "+1 555 200 3000",
        techStack: ["Vue"],
        enrichmentSources: {
          website: "direct",
          companyDomain: "direct",
          company: "direct",
          phone: "direct",
          techStack: "direct",
        },
      },
      {
        contact: {
          findUnique,
          update,
          create: jest.fn(),
        },
      } as never
    );

    expect(update).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        website: "https://new.com",
        companyDomain: "new.com",
        company: "New Co",
        phone: "+1 555 200 3000",
        techStack: ["Vue"],
      }),
    }));
  });
});

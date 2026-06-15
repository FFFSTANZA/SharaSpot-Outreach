import { Request, Response } from "express";
import { prisma } from "../config/prisma";
import { FREE_EMAIL_DOMAINS } from "../config/data";
import { enrichCompanyProfile } from "../utils/companyEnrichment";
import { getOrgId, getOrgScope } from "../utils/orgScope";
import { normalizeEmailAddress, normalizeWebsite } from "../utils/contactEnrichment";

const CONTACT_INCLUDE = {
  tags: true,
  lists: true,
  assignedTo: { select: { id: true, name: true, email: true, avatarUrl: true } },
};

const normalizeOptionalText = (value: unknown): string | null => {
  if (typeof value !== "string") return null;
  const text = value.trim();
  return text || null;
};

const getCorporateEmailDomain = (value: string | null): string | null => {
  const email = normalizeEmailAddress(value);
  if (!email) return null;
  const domain = email.split("@")[1] ?? null;
  return domain && !FREE_EMAIL_DOMAINS.has(domain) ? domain : null;
};

const getRelatedContactWhere = (company: { domain: string; name: string }) => ({
  OR: [
    { companyDomain: company.domain },
    { website: { contains: company.domain, mode: "insensitive" as const } },
    { company: { equals: company.name, mode: "insensitive" as const } },
  ],
});

async function prepareCompanyInput(input: { name?: unknown; website?: unknown; email?: unknown }) {
  const directWebsite = normalizeWebsite(input.website);
  const directEmail = normalizeEmailAddress(input.email);
  const enriched = await enrichCompanyProfile({
    name: normalizeOptionalText(input.name),
    website: directWebsite,
    email: directEmail,
  });

  return {
    name: normalizeOptionalText(input.name) ?? enriched.name ?? enriched.domain,
    website: directWebsite ?? enriched.website,
    domain: enriched.domain,
    primaryEmail: directEmail ?? enriched.primaryEmail,
    phone: enriched.phone,
    linkedinUrl: enriched.linkedinUrl,
    twitterUrl: enriched.twitterUrl,
    githubUrl: enriched.githubUrl,
    facebookUrl: enriched.facebookUrl,
    instagramUrl: enriched.instagramUrl,
    techStack: enriched.techStack,
    lastEnrichedAt: enriched.lastEnrichedAt,
  };
}

export const listCompanies = async (req: Request, res: Response) => {
  try {
    const scope = getOrgScope(req);
    const companies = await prisma.prmCompany.findMany({
      where: { ...scope },
      orderBy: [{ updatedAt: "desc" }],
      take: 50,
    });

    const contacts = await prisma.contact.findMany({
      where: { ...scope },
      select: { companyDomain: true, website: true, company: true },
    });

    const withCounts = companies.map((company) => ({
      ...company,
      relatedContactCount: contacts.filter((contact) => {
        const websiteMatches = normalizeWebsite(contact.website)?.includes(company.domain) ?? false;
        return contact.companyDomain === company.domain || websiteMatches || (contact.company?.trim().toLowerCase() === company.name.trim().toLowerCase());
      }).length,
    }));

    res.json(withCounts);
  } catch (error) {
    res.status(500).json({ message: "An error occurred" });
  }
};

export const createCompany = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const prepared = await prepareCompanyInput(req.body ?? {});
    const company = await prisma.prmCompany.upsert({
      where: { userId_domain: { userId, domain: prepared.domain } },
      update: {
        ...prepared,
        organizationId: getOrgId(req),
      },
      create: {
        userId,
        organizationId: getOrgId(req),
        ...prepared,
      },
    });

    res.status(201).json(company);
  } catch (error) {
    res.status(400).json({ message: "Failed to create company" });
  }
};

export const getCompanyById = async (req: Request, res: Response) => {
  try {
    const scope = getOrgScope(req);
    const id = req.params.id as string;
    const company = await prisma.prmCompany.findFirst({
      where: { id, ...scope },
    });

    if (!company) {
      return res.status(404).json({ message: "Company not found" });
    }

    const relatedContacts = await prisma.contact.findMany({
      where: { ...scope, ...getRelatedContactWhere(company) },
      include: CONTACT_INCLUDE,
      orderBy: { updatedAt: "desc" },
      take: 50,
    });

    res.json({
      ...company,
      relatedContacts,
      relatedContactCount: relatedContacts.length,
      fallbackWebsite: company.website ?? (getCorporateEmailDomain(company.primaryEmail) ? `https://${getCorporateEmailDomain(company.primaryEmail)}` : null),
    });
  } catch (error) {
    res.status(500).json({ message: "An error occurred" });
  }
};

export const refreshCompany = async (req: Request, res: Response) => {
  try {
    const scope = getOrgScope(req);
    const id = req.params.id as string;
    const existing = await prisma.prmCompany.findFirst({ where: { id, ...scope } });
    if (!existing) {
      return res.status(404).json({ message: "Company not found" });
    }

    const prepared = await prepareCompanyInput({
      name: existing.name,
      website: existing.website,
      email: existing.primaryEmail,
    });

    const company = await prisma.prmCompany.update({
      where: { id: existing.id },
      data: prepared,
    });

    res.json(company);
  } catch (error) {
    res.status(400).json({ message: "Failed to refresh company" });
  }
};

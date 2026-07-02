import { prisma } from "../config/prisma";

const DEFAULT_TAGS = [
  { name: "Investor", color: "#ef4444" },
  { name: "Founder", color: "#f59e0b" },
  { name: "Recruiter", color: "#10b981" },
] as const;

export async function ensureUserOnboardingDefaults(
  userId: string,
  userName: string | null,
  userEmail: string,
  organizationId: string | null = null,
): Promise<void> {
  await prisma.sender.upsert({
    where: {
      userId_email: {
        userId,
        email: userEmail,
      },
    },
    update: organizationId ? { organizationId } : {},
    create: {
      userId,
      organizationId,
      email: userEmail,
      name: userName,
      appPassword: "",
    },
  });

  for (const tag of DEFAULT_TAGS) {
    await prisma.tag.upsert({
      where: {
        userId_name: {
          userId,
          name: tag.name,
        },
      },
      update: {},
      create: {
        userId,
        name: tag.name,
        color: tag.color,
      },
    });
  }
}

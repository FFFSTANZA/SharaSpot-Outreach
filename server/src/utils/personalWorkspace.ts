import { prisma } from "../config/prisma";
import { ensureUserOnboardingDefaults } from "./userOnboarding";

export async function ensurePersonalWorkspace(userId: string, userName: string | null, userEmail: string): Promise<string> {
  const organizationId = await prisma.$transaction(async (tx) => {
    const currentUser = await tx.user.findUnique({
      where: { id: userId },
      select: { activeOrganizationId: true },
    });

    if (!currentUser) {
      throw new Error(`User ${userId} not found`);
    }

    if (currentUser.activeOrganizationId) {
      return currentUser.activeOrganizationId;
    }

    const existingOwnedOrg = await tx.organization.findFirst({
      where: { ownerId: userId },
      select: { id: true },
      orderBy: { createdAt: "asc" },
    });

    const organizationId = existingOwnedOrg?.id || (
      await tx.organization.create({
        data: {
          name: `${userName || userEmail}'s Workspace`,
          ownerId: userId,
        },
        select: { id: true },
      })
    ).id;

    await tx.organizationMember.upsert({
      where: {
        organizationId_userId: {
          organizationId,
          userId,
        },
      },
      update: { role: "OWNER" },
      create: {
        organizationId,
        userId,
        role: "OWNER",
      },
    });

    await tx.user.update({
      where: { id: userId },
      data: { activeOrganizationId: organizationId },
    });

    await tx.sender.updateMany({
      where: { userId, organizationId: null },
      data: { organizationId },
    });

    return organizationId;
  });

  await ensureUserOnboardingDefaults(userId, userName, userEmail, organizationId);

  return organizationId;
}

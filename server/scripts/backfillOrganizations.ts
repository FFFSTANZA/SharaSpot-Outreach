import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";
dotenv.config();

const prisma = new PrismaClient();

async function main() {
  console.log("Starting organization backfill...");
  const users = await prisma.user.findMany({
    include: {
      organizationMemberships: true,
    },
  });

  let created = 0;
  let skipped = 0;

  for (const user of users) {
    if (user.organizationMemberships.length > 0) {
      skipped++;
      continue;
    }

    const org = await prisma.organization.create({
      data: {
        name: `${user.name || user.email}'s Workspace`,
        ownerId: user.id,
        members: {
          create: { userId: user.id, role: "OWNER" },
        },
      },
    });

    await prisma.user.update({
      where: { id: user.id },
      data: { activeOrganizationId: org.id },
    });

    const resources = [
      prisma.emailCampaign.updateMany({ where: { userId: user.id }, data: { organizationId: org.id } }),
      prisma.sender.updateMany({ where: { userId: user.id }, data: { organizationId: org.id } }),
      prisma.contact.updateMany({ where: { userId: user.id }, data: { organizationId: org.id } }),
      prisma.emailTemplate.updateMany({ where: { userId: user.id }, data: { organizationId: org.id } }),
      prisma.tag.updateMany({ where: { userId: user.id }, data: { organizationId: org.id } }),
      prisma.contactList.updateMany({ where: { userId: user.id }, data: { organizationId: org.id } }),
      prisma.callTask.updateMany({ where: { userId: user.id }, data: { organizationId: org.id } }),
      prisma.prmSegment.updateMany({ where: { userId: user.id }, data: { organizationId: org.id } }),
      prisma.webhook.updateMany({ where: { userId: user.id }, data: { organizationId: org.id } }),
      prisma.mcpApiKey.updateMany({ where: { userId: user.id }, data: { organizationId: org.id } }),
      prisma.bounceList.updateMany({ where: { userId: user.id }, data: { organizationId: org.id } }),
    ];
    await Promise.all(resources);

    // Backfill inbox emails/threads via sender ownership
    const senders = await prisma.sender.findMany({ where: { userId: user.id }, select: { id: true } });
    const senderIds = senders.map(s => s.id);
    if (senderIds.length > 0) {
      await prisma.inboxEmail.updateMany({ where: { senderId: { in: senderIds } }, data: { organizationId: org.id } });
      await prisma.inboxThread.updateMany({ where: { senderId: { in: senderIds } }, data: { organizationId: org.id } });
    }

    created++;
    console.log(`  Created org for ${user.email} (${org.id})`);
  }

  console.log(`\nDone: ${created} created, ${skipped} already had orgs`);
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error("Backfill failed:", err);
  process.exit(1);
});

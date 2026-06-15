import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const email = "fffstanza@gmail.com";
  const name = "Test User";

  console.log(`Creating/updating user ${email}...`);

  const existingUser = await prisma.user.findUnique({ where: { email } });

  if (existingUser) {
    console.log(`User ${email} already exists (id: ${existingUser.id})`);
    const sub = await prisma.subscription.findUnique({ where: { userId: existingUser.id } });
    if (!sub) {
      await prisma.subscription.create({
        data: {
          userId: existingUser.id,
          status: "ACTIVE",
          currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
          trialEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        },
      });
      console.log("Created free trial subscription");
    } else {
      console.log("Subscription already exists");
    }
    return;
  }

  const user = await prisma.user.create({
    data: {
      email,
      name,
    },
  });
  console.log(`Created user: ${user.id}`);

  const org = await prisma.organization.create({
    data: {
      name: `${name}'s Workspace`,
      ownerId: user.id,
      members: {
        create: {
          userId: user.id,
          role: "OWNER",
        },
      },
    },
  });
  console.log(`Created organization: ${org.id}`);

  await prisma.user.update({
    where: { id: user.id },
    data: { activeOrganizationId: org.id },
  });
  console.log("Set activeOrganizationId");

  const defaultTags = [
    { name: "Investor", color: "#EF4444" },
    { name: "Founder", color: "#F59E0B" },
    { name: "Recruiter", color: "#10B981" },
  ];
  for (const tag of defaultTags) {
    await prisma.tag.create({
      data: { userId: user.id, name: tag.name, color: tag.color },
    });
  }
  console.log("Created default tags");

  await prisma.subscription.create({
    data: {
      userId: user.id,
      status: "ACTIVE",
      currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      trialEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    },
  });
  console.log("Created free trial subscription (1 year)");

  console.log("\nDone! User is ready. Sign in with Google using fffstanza@gmail.com");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

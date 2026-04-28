const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function getEffectiveProviderLimits(senderId) {
  const sender = await prisma.sender.findUnique({
    where: { id: senderId },
    include: { providerProfile: true },
  });

  if (!sender?.providerProfile) {
    return { perMinute: 10, perHour: 100, perDay: 500 };
  }
  return {
    perMinute: sender.providerProfile.perMinuteLimit,
    perHour: sender.providerProfile.perHourLimit,
    perDay: sender.providerProfile.perDayLimit,
  };
}

async function getWarmupDayLimit(senderId) {
  const schedule = await prisma.warmupSchedule.findUnique({ where: { senderId } });
  if (!schedule || schedule.optedOut || !schedule.isActive) return null;
  const currentDay = Math.floor((Date.now() - new Date(schedule.startDate).getTime()) / 86400000);
  if (currentDay >= schedule.durationDays) return null;
  return schedule.dailyLimits[currentDay] ?? null;
}

async function getAdaptiveState(senderId) {
  const recentJobs = await prisma.emailJob.findMany({
    where: {
      senderId,
      status: { in: ["SENT", "FAILED"] },
      createdAt: { gte: new Date(Date.now() - 3600000) },
    },
    select: { status: true, error: true },
  });

  const totalCount = recentJobs.length;
  const failedJobs = recentJobs.filter((j) => j.status === "FAILED");
  const failedCount = failedJobs.length;

  const bouncedCount = failedJobs.filter((j) => {
    if (!j.error) return false;
    const lower = j.error.toLowerCase();
    return lower.includes("bounce") || /5\d{2}/.test(lower);
  }).length;

  const errorRate = totalCount > 0 ? failedCount / totalCount : 0;
  const bounceRate = totalCount > 0 ? bouncedCount / totalCount : 0;

  const cooldown = await prisma.senderCooldown.findUnique({ where: { senderId } });
  const isQuarantined = cooldown?.quarantinedAt != null;
  const isCooldown = !isQuarantined && cooldown?.cooldownUntil != null && cooldown.cooldownUntil > new Date();

  const isThrottled = errorRate > 0.1 || bounceRate > 0.05;
  const rateMultiplier = isThrottled ? 0.5 : 1.0;

  return { rateMultiplier, isThrottled, isCooldown, isQuarantined };
}

async function getEffectiveLimits(senderId) {
  const providerLimits = await getEffectiveProviderLimits(senderId);
  const sender = await prisma.sender.findUnique({ where: { id: senderId }, select: { hourlyLimit: true, dailyLimit: true } });
  const warmupDayLimit = await getWarmupDayLimit(senderId);
  const adaptiveState = await getAdaptiveState(senderId);

  let perMinute = providerLimits.perMinute;
  let perHour = Math.min(providerLimits.perHour, sender?.hourlyLimit ?? providerLimits.perHour);
  let perDay = Math.min(providerLimits.perDay, sender?.dailyLimit ?? providerLimits.perDay);

  if (warmupDayLimit !== null) perDay = Math.min(perDay, warmupDayLimit);

  perMinute = Math.max(1, Math.floor(perMinute * adaptiveState.rateMultiplier));
  perHour = Math.max(1, Math.floor(perHour * adaptiveState.rateMultiplier));
  perDay = Math.max(1, Math.floor(perDay * adaptiveState.rateMultiplier));

  return { perMinute, perHour, perDay };
}

async function test() {
  try {
    const id = "cmoid9dlp00e0nx07i9nutcdo";
    const campaign = await prisma.emailCampaign.findUnique({
      where: { id },
      include: {
        campaignSenders: {
          orderBy: { rotationOrder: "asc" },
          include: { sender: { select: { id: true, email: true, name: true, dailyLimit: true } } },
        },
      },
    });

    let senderPool = campaign.campaignSenders.map(cs => ({ senderId: cs.sender.id }));
    console.log("senderPool mapped", senderPool);

    for (const s of senderPool) {
      console.log("Getting effective limits for", s.senderId);
      const limits = await getEffectiveLimits(s.senderId);
      console.log("Limits:", limits);
    }
    
    console.log("Done");
  } catch(e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}
test();

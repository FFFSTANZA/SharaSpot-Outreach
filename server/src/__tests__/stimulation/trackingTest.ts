import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const USER_AGENTS = {
  chrome: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  chromeMobile: "Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/120.0.0.0 Mobile/15E148 Safari/604.1",
  safari: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15",
  safariMobile: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Mobile/15E148 Safari/604.1",
  firefox: "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0",
  outlook: "Mozilla/4.0 (compatible; MSIE 10.0; Windows NT 6.1; WOW64; Trident/6.0)",
  gmailApp: "Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36 (Gmail)",
  bot: "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
};

const TEST_URLS = [
  "https://example.com/product",
  "https://example.com/pricing?utm_source=email&utm_medium=campaign",
  "https://example.com/blog/new-feature",
  "https://example.com/contact?utm_source=email&utm_campaign=launch",
];

const IP_ADDRESSES = [
  "192.168.1.1",
  "10.0.0.1",
  "172.16.0.1",
  "203.0.113.1",
  "198.51.100.1",
];

async function createTestData() {
  console.log("[Test] Creating test data...");
  
  const user = await prisma.user.findFirst({ orderBy: { createdAt: "desc" } });
  if (!user) {
    console.error("[Test] ERROR: No user found. Create a user first.");
    process.exit(1);
  }
  
  const sender = await prisma.sender.findFirst({ where: { userId: user.id } });
  if (!sender) {
    console.error("[Test] ERROR: No sender found. Create a sender first.");
    process.exit(1);
  }
  
  const campaign = await prisma.emailCampaign.create({
    data: {
      userId: user.id,
      subject: `Test Campaign - ${Date.now()}`,
      body: "<html><body><h1>Test</h1><a href='https://example.com'>Link</a></body></html>",
      startTime: new Date(),
      delaySeconds: 0,
      hourlyLimit: 100,
      totalRecipients: 100,
      trackOpens: true,
      trackClicks: true,
    },
  });
  
  const emailJobs = await Promise.all(
    Array.from({ length: 50 }, (_, i) =>
      prisma.emailJob.create({
        data: {
          campaignId: campaign.id,
          senderId: sender.id,
          toEmail: `test${i}@example.com`,
          scheduledAt: new Date(),
          status: "SENT",
          sentAt: new Date(),
        },
      })
    )
  );
  
  console.log(`[Test] Created campaign with ${emailJobs.length} email jobs`);
  return { campaign, emailJobs, user };
}

async function recordOpen(emailJobId: string, userAgent: string, ipAddress: string, token?: string) {
  const res = await fetch(
    `http://localhost:8000/track/open/${emailJobId}${token ? `?token=${token}` : ""}`,
    {
      method: "GET",
      headers: {
        "User-Agent": userAgent,
        "X-Forwarded-For": ipAddress,
      },
    }
  );
  
  const buffer = await res.arrayBuffer();
  return buffer.byteLength === 43;
}

async function recordClick(emailJobId: string, url: string, userAgent: string, ipAddress: string, utmParams?: string) {
  const targetUrl = `http://localhost:8000/track/click/${emailJobId}?url=${encodeURIComponent(url)}${utmParams || ""}`;
  const res = await fetch(targetUrl, {
    method: "GET",
    headers: {
      "User-Agent": userAgent,
      "X-Forwarded-For": ipAddress,
    },
    redirect: "manual",
  });
  
  return res.status === 302;
}

async function simulateOpens(emailJobs: any[], count: number) {
  console.log(`[Test] Simulating ${count} OPEN events...`);
  const userAgents = Object.values(USER_AGENTS);
  const ips = IP_ADDRESSES;
  
  let successCount = 0;
  for (let i = 0; i < count; i++) {
    const job = emailJobs[i % emailJobs.length];
    const ua = userAgents[i % userAgents.length];
    const ip = ips[i % ips.length];
    const token = `tok_${Math.random().toString(36).slice(2)}`;
    
    const success = await recordOpen(job.id, ua, ip, token);
    if (success) successCount++;
    
    if ((i + 1) % 10 === 0) {
      console.log(`[Test] Progress: ${i + 1}/${count} opens recorded`);
    }
  }
  
  console.log(`[Test] OPEN events: ${successCount}/${count} successful`);
  return successCount;
}

async function simulateClicks(emailJobs: any[], count: number) {
  console.log(`[Test] Simulating ${count} CLICK events...`);
  const userAgents = Object.values(USER_AGENTS);
  const ips = IP_ADDRESSES;
  const urls = TEST_URLS;
  
  let successCount = 0;
  for (let i = 0; i < count; i++) {
    const job = emailJobs[i % emailJobs.length];
    const ua = userAgents[i % userAgents.length];
    const ip = ips[i % ips.length];
    const url = urls[i % urls.length];
    
    const utmSuffix = i % 2 === 0 ? "&utm_source=email&utm_medium=campaign" : "";
    const success = await recordClick(job.id, url, ua, ip, utmSuffix);
    if (success) successCount++;
    
    if ((i + 1) % 10 === 0) {
      console.log(`[Test] Progress: ${i + 1}/${count} clicks recorded`);
    }
  }
  
  console.log(`[Test] CLICK events: ${successCount}/${count} successful`);
  return successCount;
}

async function verifyAnalytics(campaignId: string) {
  console.log("[Test] Verifying analytics...");
  
  const sent = await prisma.emailJob.count({
    where: { campaignId, status: "SENT" },
  });
  
  const opens = await prisma.trackingEvent.count({
    where: { emailJob: { campaignId }, eventType: "OPEN" },
  });
  
  const clicks = await prisma.trackingEvent.count({
    where: { emailJob: { campaignId }, eventType: "CLICK" },
  });
  
  const uniqueOpens = await prisma.trackingEvent.groupBy({
    by: ["emailJobId"],
    where: { emailJob: { campaignId }, eventType: "OPEN" },
  });
  
  const uniqueClicks = await prisma.trackingEvent.groupBy({
    by: ["emailJobId"],
    where: { emailJob: { campaignId }, eventType: "CLICK" },
  });
  
const platforms = await prisma.trackingEvent.findMany({
    where: { emailJob: { campaignId } },
    select: { platform: true },
  });
  
  const platformCounts = new Map<string, number>();
  for (const p of platforms) {
    const plat = p.platform || "unknown";
    platformCounts.set(plat, (platformCounts.get(plat) || 0) + 1);
  }
  const platformStr = Array.from(platformCounts.entries()).map(([p, c]) => `${p}:${c}`).join(", ");

  const devices = await Promise.all([
    prisma.trackingEvent.count({
      where: { emailJob: { campaignId }, isMobile: true },
    }),
    prisma.trackingEvent.count({
      where: { emailJob: { campaignId }, isDesktop: true },
    }),
    prisma.trackingEvent.count({
      where: { emailJob: { campaignId }, isBot: true },
    }),
  ]);
  
  console.log(`
[Test] Analytics Results for Campaign ${campaignId}:
  - Sent: ${sent}
  - Opens: ${opens} (unique: ${uniqueOpens.length})
  - Clicks: ${clicks} (unique: ${uniqueClicks.length})
  - Click-to-Open Rate: ${opens > 0 ? Math.round((clicks / opens) * 100) : 0}%
  - Open Rate: ${sent > 0 ? Math.round((uniqueOpens.length / sent) * 100) : 0}%
  - Click Rate: ${sent > 0 ? Math.round((uniqueClicks.length / sent) * 100) : 0}%
  - Platforms: ${platformStr}
  - Devices: Mobile:${devices[0]}, Desktop:${devices[1]}, Bot:${devices[2]}
  `);
  
  return { sent, opens, clicks, uniqueOpens: uniqueOpens.length, uniqueClicks: uniqueClicks.length };
}

async function waitForFlush(ms: number = 6000) {
  console.log(`[Test] Waiting ${ms}ms for Redis buffer flush...`);
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function cleanup(campaignId: string) {
  console.log("[Test] Cleaning up test data...");
  
  const jobs = await prisma.emailJob.findMany({
    where: { campaignId },
    select: { id: true },
  });
  
  for (const job of jobs) {
    await prisma.trackingEvent.deleteMany({ where: { emailJobId: job.id } });
  }
  
  await prisma.emailJob.deleteMany({ where: { campaignId } });
  await prisma.emailCampaign.delete({ where: { id: campaignId } });
  
  console.log("[Test] Cleanup complete");
}

async function runFullTest() {
  try {
    console.log("=".repeat(50));
    console.log("[Test] Starting Deep Stimulation Test");
    console.log("=".repeat(50));
    
    const { campaign, emailJobs, user } = await createTestData();
    
    console.log("\n--- Phase 1: OPEN Tracking Test ---");
    await simulateOpens(emailJobs, 30);
    await waitForFlush();
    
    console.log("\n--- Phase 2: CLICK Tracking Test ---");
    await simulateClicks(emailJobs, 20);
    await waitForFlush();
    
    console.log("\n--- Phase 3: Cross-Client Test ---");
    for (const [name, ua] of Object.entries(USER_AGENTS)) {
      const job = emailJobs[0];
      await recordOpen(job.id, ua, "192.168.1.1");
      console.log(`[Test] Tested with: ${name}`);
    }
    await waitForFlush();
    
    console.log("\n--- Phase 4: Analytics Verification ---");
    const results = await verifyAnalytics(campaign.id);
    
    console.log("\n--- Phase 5: Cleanup ---");
    await cleanup(campaign.id);
    
    console.log("\n" + "=".repeat(50));
    console.log("[Test] Deep Stimulation Test Complete");
    console.log("=".repeat(50));
    
    if (results.opens > 0 && results.clicks > 0) {
      console.log("[Test] SUCCESS: Tracking is working correctly!");
    } else {
      console.log("[Test] WARNING: No tracking events recorded");
    }
    
    process.exit(results.opens > 0 ? 0 : 1);
  } catch (error) {
    console.error("[Test] ERROR:", error);
    process.exit(1);
  }
}

runFullTest();
import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const USER_AGENTS = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/120.0.0.0 Mobile/15E148 Safari/604.1",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0",
  "Mozilla/4.0 (compatible; MSIE 10.0; Windows NT 6.1; WOW64; Trident/6.0)",
  "Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
  "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
];

function parseUserAgent(userAgent: string) {
  const ua = userAgent.toLowerCase();
  let platform = "unknown";
  let isMobile = false;
  let isDesktop = false;
  let isBot = false;
  let browser = "unknown";

  if (/bot|spider|crawler/.test(ua)) {
    isBot = true;
    platform = "bot";
  } else if (/iphone|ipad|ipod|android|mobile/.test(ua)) {
    isMobile = true;
    if (/iphone|ipad|ipod/.test(ua)) platform = "iOS";
    else platform = "Android";
  } else if (/mac|windows|linux/.test(ua)) {
    isDesktop = true;
    if (/mac/.test(ua)) platform = "macOS";
    else if (/windows/.test(ua)) platform = "Windows";
    else platform = "Linux";
  }

  if (/chrome/.test(ua) && !/edge/.test(ua)) browser = "Chrome";
  else if (/firefox/.test(ua)) browser = "Firefox";
  else if (/safari/.test(ua) && !/chrome/.test(ua)) browser = "Safari";
  else if (/edge/.test(ua)) browser = "Edge";
  else if (/opera|opr/.test(ua)) browser = "Opera";
  else if (/msie|trident/.test(ua)) browser = "IE";

  return { platform, isMobile, isDesktop, isBot, browser };
}

async function runDirectTest() {
  try {
    console.log("=".repeat(50));
    console.log("[DirectTest] Starting Direct Database Test");
    console.log("=".repeat(50));

    const user = await prisma.user.findFirst({ orderBy: { createdAt: "desc" } });
    if (!user) {
      console.error("[DirectTest] ERROR: No user found");
      process.exit(1);
    }
    
    const sender = await prisma.sender.findFirst({ where: { userId: user.id } });
    if (!sender) {
      console.error("[DirectTest] ERROR: No sender found");
      process.exit(1);
    }

    const campaign = await prisma.emailCampaign.create({
      data: {
        userId: user.id,
        subject: `Direct Test Campaign - ${Date.now()}`,
        body: "<html><body><h1>Test</h1></body></html>",
        startTime: new Date(),
        delaySeconds: 0,
        hourlyLimit: 100,
        totalRecipients: 50,
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
            toEmail: `directtest${i}@example.com`,
            scheduledAt: new Date(),
            status: "SENT",
            sentAt: new Date(),
          },
        })
      )
    );

    console.log(`[DirectTest] Created campaign: ${campaign.id}`);
    console.log(`[DirectTest] Created ${emailJobs.length} email jobs`);

    console.log("\n--- Phase 1: Recording OPEN events ---");
    let openCount = 0;
    for (let i = 0; i < emailJobs.length; i++) {
      const job = emailJobs[i];
      const ua = USER_AGENTS[i % USER_AGENTS.length];
      const platformInfo = parseUserAgent(ua);

      await prisma.trackingEvent.create({
        data: {
          emailJobId: job.id,
          eventType: "OPEN",
          ipAddress: `192.168.1.${i + 1}`,
          userAgent: ua,
          platform: platformInfo.platform,
          browser: platformInfo.browser,
          isMobile: platformInfo.isMobile,
          isDesktop: platformInfo.isDesktop,
          isBot: platformInfo.isBot,
        },
      });
      openCount++;

      if ((i + 1) % 10 === 0) {
        console.log(`[DirectTest] Progress: ${i + 1}/${emailJobs.length} opens`);
      }
    }
    console.log(`[DirectTest] Created ${openCount} OPEN events`);

    console.log("\n--- Phase 2: Recording CLICK events ---");
    const testUrls = [
      "https://example.com/product",
      "https://example.com/pricing?utm_source=email&utm_medium=campaign",
      "https://example.com/blog",
    ];
    let clickCount = 0;
    for (let i = 0; i < emailJobs.length / 2; i++) {
      const job = emailJobs[i];
      const ua = USER_AGENTS[i % USER_AGENTS.length];
      const platformInfo = parseUserAgent(ua);

      await prisma.trackingEvent.create({
        data: {
          emailJobId: job.id,
          eventType: "CLICK",
          url: testUrls[i % testUrls.length],
          ipAddress: `192.168.1.${i + 1}`,
          userAgent: ua,
          platform: platformInfo.platform,
          browser: platformInfo.browser,
          isMobile: platformInfo.isMobile,
          isDesktop: platformInfo.isDesktop,
          isBot: platformInfo.isBot,
        },
      });
      clickCount++;
    }
    console.log(`[DirectTest] Created ${clickCount} CLICK events`);

    console.log("\n--- Phase 3: Analytics Verification ---");
    const sent = await prisma.emailJob.count({
      where: { campaignId: campaign.id, status: "SENT" },
    });
    const uniqueOpens = await prisma.trackingEvent.groupBy({
      by: ["emailJobId"],
      where: { emailJob: { campaignId: campaign.id }, eventType: "OPEN" },
    });
    const uniqueClicks = await prisma.trackingEvent.groupBy({
      by: ["emailJobId"],
      where: { emailJob: { campaignId: campaign.id }, eventType: "CLICK" },
    });
    const opens = await prisma.trackingEvent.count({
      where: { emailJob: { campaignId: campaign.id }, eventType: "OPEN" },
    });
    const clicks = await prisma.trackingEvent.count({
      where: { emailJob: { campaignId: campaign.id }, eventType: "CLICK" },
    });
    
    const platformEvents = await prisma.trackingEvent.findMany({
      where: { emailJob: { campaignId: campaign.id } },
      select: { platform: true, isMobile: true, isDesktop: true, isBot: true },
    });
    
    const platformCounts = new Map<string, number>();
    let mobileCount = 0, desktopCount = 0, botCount = 0;
    for (const e of platformEvents) {
      const p = e.platform || "unknown";
      platformCounts.set(p, (platformCounts.get(p) || 0) + 1);
      if (e.isMobile) mobileCount++;
      if (e.isDesktop) desktopCount++;
      if (e.isBot) botCount++;
    }
    const platforms = Array.from(platformCounts.entries()).map(([platform, count]) => `${platform}:${count}`).join(", ");

    console.log(`
[DirectTest] Results:
  - Sent: ${sent}
  - Opens: ${opens} (unique: ${uniqueOpens.length})
  - Clicks: ${clicks} (unique: ${uniqueClicks.length})
  - Open Rate: ${sent > 0 ? Math.round((uniqueOpens.length / sent) * 100) : 0}%
  - Click Rate: ${sent > 0 ? Math.round((uniqueClicks.length / sent) * 100) : 0}%
  - Platforms: ${platforms}
  - Devices: Mobile:${mobileCount}, Desktop:${desktopCount}, Bot:${botCount}
    `);

    console.log("\n--- Phase 4: Analytics Verification (keeping data for demo) ---");
    console.log("[DirectTest] Leaving data in place for analytics demo");
    console.log(`
[DirectTest] Results for Campaign ${campaign.id}:
  - Sent: ${sent}
  - Opens: ${opens} (unique: ${uniqueOpens.length})
  - Clicks: ${clicks} (unique: ${uniqueClicks.length})
  - Open Rate: ${sent > 0 ? Math.round((uniqueOpens.length / sent) * 100) : 0}%
  - Click Rate: ${sent > 0 ? Math.round((uniqueClicks.length / sent) * 100) : 0}%
  - Platforms: ${platforms}
  - Devices: Mobile:${mobileCount}, Desktop:${desktopCount}, Bot:${botCount}
    `);

    console.log("\n" + "=".repeat(50));
    console.log("[DirectTest] SUCCESS: Analytics data created!");
    console.log("[DirectTest] Demo data will persist for testing");
    console.log("=".repeat(50));
    
    console.log("\nCampaign ID for testing:", campaign.id);
    
    process.exit(0);
  } catch (error) {
    console.error("[DirectTest] ERROR:", error);
    process.exit(1);
  }
}

runDirectTest();
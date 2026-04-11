import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const systemTemplates = [
  {
    name: "Cold Outreach - Initial Contact",
    subject: "Quick question about {{company}}",
    body: `<p>Hi {{first_name}},</p>
<p>I hope this email finds you well. My name is {{my_name}} from {{my_company}}, and I came across {{company}} while researching {{industry}}.</p>
<p>I noticed that {{pain_point}} is a common challenge in your space. We've helped companies like yours achieve {{benefit}} without {{drawback}}.</p>
<p>Would you be open to a quick 15-minute call this week to explore if there's a potential fit?</p>
<p>Best regards,<br/>{{my_name}}<br/>{{my_email}}</p>`,
  },
  {
    name: "Follow-up #1 - No Response",
    subject: "Re: Quick question about {{company}}",
    body: `<p>Hi {{first_name}},</p>
<p>I wanted to follow up on my previous email. I understand you're likely busy, so I'll keep this brief.</p>
<p>Just wanted to make sure my message reached you. If {{topic}} isn't a priority right now, no worries at all — I won't follow up again.</p>
<p>If it would be helpful, I'd be happy to share a quick case study showing how similar companies achieved {{benefit}}.</p>
<p>Let me know,<br/>{{my_name}}</p>`,
  },
  {
    name: "Follow-up #2 - Last Chance",
    subject: "Final follow-up",
    body: `<p>Hi {{first_name}},</p>
<p>This is my last attempt to reach you. I don't want to take up any more of your time.</p>
<p>If you'd ever like to chat about {{topic}} in the future, feel free to reply and I'll send over some relevant resources.</p>
<p>Wishing you and {{company}} all the best,<br/>{{my_name}}</p>`,
  },
  {
    name: "Meeting Request - Sales",
    subject: "Quick call to discuss {{company}}'s goals?",
    body: `<p>Hi {{first_name}},</p>
<p>I recently connected with your colleague at {{company}} and they mentioned you're working on {{project}}.</p>
<p>I'd love to schedule a brief call to understand your current challenges and see if we can help. We typically save companies like yours {{time_saved}} per week on {{task}}.</p>
<p>Would any of these times work for a 20-minute call?</p>
<ul>
<li>Monday 10-11 AM</li>
<li>Tuesday 2-3 PM</li>
<li>Wednesday 11 AM-12 PM</li>
</ul>
<p>Looking forward to connecting,<br/>{{my_name}}</p>`,
  },
  {
    name: "Value Add - Building Relationship",
    subject: "Thought this might help {{first_name}}",
    body: `<p>Hi {{first_name}},</p>
<p>I came across this {{resource_type}} about {{topic}} and thought it might be relevant to {{company}}'s current initiatives.</p>
<p>Here's the link: {{resource_link}}</p>
<p>Let me know if you'd like to discuss any of the points raised. Always happy to chat.</p>
<p>Best,<br/>{{my_name}}</p>`,
  },
  {
    name: "Referral Request",
    subject: "Quick favor - know anyone at {{target_company}}?",
    body: `<p>Hi {{first_name}},</p>
<p>I hope you're doing well! I'm reaching out because I'm trying to connect with someone at {{target_company}} who handles {{role}}.</p>
<p>I know you probably get a lot of these requests, so no pressure at all. But if you happen to know anyone there or could make an introduction, I'd really appreciate it.</p>
<p>In return, I'm happy to return the favor whenever you need anything from my network.</p>
<p>Thanks so much for considering,<br/>{{my_name}}</p>`,
  },
  {
    name: "Product Demo Request",
    subject: "Demo request for {{company}}",
    body: `<p>Hi {{first_name}},</p>
<p>Thank you for your interest in {{my_company}}! I'd love to show you how we help companies like {{company}}.</p>
<p>A typical demo covers:</p>
<ul>
<li>{{feature_1}}</li>
<li>{{feature_2}}</li>
<li>{{feature_3}}</li>
</ul>
<p>The demo usually takes about 30 minutes. Are you available for a live walkthrough this week or next?</p>
<p>Please let me know your preferred time and I'll send over a calendar invite.</p>
<p>Best regards,<br/>{{my_name}}<br/>{{my_email}}</p>`,
  },
  {
    name: "Partnership Inquiry",
    subject: "Partnership opportunity - {{my_company}} x {{company}}",
    body: `<p>Hi {{first_name}},</p>
<p>I leads {{my_company}}'s partnership initiatives, and I believe there's a compelling opportunity for {{my_company}} and {{company}} to collaborate.</p>
<p>Here's what I have in mind:</p>
<ul>
<li>{{partnership_benefit_1}}</li>
<li>{{partnership_benefit_2}}</li>
<li>{{partnership_benefit_3}}</li>
</ul>
<p>Would you be open to a call to explore this further? I have time {{available_times}}.</p>
<p>Looking forward to hearing from you,<br/>{{my_name}}<br/>{{my_title}}</p>`,
  },
  {
    name: "Job Application - Intro",
    subject: "Application for {{job_title}} position at {{company}}",
    body: `<p>Dear {{first_name}},</p>
<p>I'm writing to express my strong interest in the {{job_title}} position at {{company}}, as advertised on {{job_source}}.</p>
<p>With {{years_experience}} years of experience in {{field}}, I've developed strong skills in:</p>
<ul>
<li>{{skill_1}}</li>
<li>{{skill_2}}</li>
<li>{{skill_3}}</li>
</ul>
<p>I was particularly drawn to {{company}} because of {{company_reason}}. I'm excited about the opportunity to contribute to {{company_goal}}.</p>
<p>I've attached my resume for your review. I'd welcome the opportunity to discuss how my background aligns with your needs.</p>
<p>Thank you for your consideration,<br/>{{my_name}}</p>`,
  },
  {
    name: "Newsletter Welcome",
    subject: "Welcome to {{company}} - Here's what to expect",
    body: `<p>Hi {{first_name}},</p>
<p>Welcome aboard! We're thrilled to have you as part of the {{company}} community.</p>
<p>Here's what you can expect:</p>
<ul>
<li>Weekly insights on {{topic_1}}</li>
<li>Exclusive resources and tools</li>
<li>Early access to new features</li>
<li>Community events and webinars</li>
</ul>
<p>To get the most out of your subscription:</p>
<ol>
<li>Check your inbox every {{frequency}} for valuable content</li>
<li>Reply to any email if you have questions — we read every response</li>
<li>Follow us on {{social_media}} for daily tips</li>
</ol>
<p>If you ever want to unsubscribe, just click the link at the bottom of any email.</p>
<p>Questions? Reply to this email — I read everything.</p>
<p>Cheers,<br/>{{my_name}}<br/>{{my_title}}</p>`,
  },
];

async function main() {
  console.log("Seeding system templates...");

  for (const template of systemTemplates) {
    const existing = await prisma.emailTemplate.findFirst({
      where: { userId: null, name: template.name },
    });

    if (existing) {
      console.log(`  ✓ "${template.name}" already exists, skipping`);
    } else {
      await prisma.emailTemplate.create({
        data: {
          userId: null,
          name: template.name,
          subject: template.subject,
          body: template.body,
        },
      });
      console.log(`  ✓ Created "${template.name}"`);
    }
  }

  console.log("\nDone! System templates are ready.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

interface FollowUpContext {
  subject: string;
  body: string;
  recipientName?: string;
  senderName?: string;
  customVariables?: Record<string, string>;
}

interface GeneratedFollowUp {
  stepNumber: number;
  subject: string;
  body: string;
  waitDays: number;
  contextSnippet?: string;
  condition?: string;
}

async function callAI(prompt: string, systemPrompt: string): Promise<string> {
  const provider = process.env.AI_PROVIDER || "groq";

  let url: string;
  let headers: Record<string, string>;
  let body: Record<string, unknown>;
  let model: string;

  if (provider === "groq") {
    model = "llama-3.1-8b-instant";
    url = "https://api.groq.com/openai/v1/chat/completions";
    headers = {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
    };
    body = {
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt },
      ],
      temperature: 0.3,
      max_tokens: 800,
    };
  } else {
    model = "google/gemini-2.0-flash";
    url = `${process.env.AICREDIT_BASE_URL || "https://api.aicredits.in/v1"}/chat/completions`;
    headers = {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${process.env.AICREDIT_API_KEY}`,
    };
    body = {
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt },
      ],
      temperature: 0.3,
      max_tokens: 800,
    };
  }

  const response = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`AI API error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

export async function generateFollowUps(context: FollowUpContext): Promise<GeneratedFollowUp[]> {
  const { subject, body, recipientName, senderName, customVariables } = context;
  const recipient = recipientName || "there";
  const sender = senderName || "me";

  const systemPrompt = `You are a High-Performance Outreach Engineer. Your mission: Generate clinical, fact-anchored follow-ups.

PRINCIPLES:
- NO FLUFF: Absolutely BAN phrases like "just checking in", "thinking of you", "bumping this", "any news", "follow up".
- FACT-LOCKING: You MUST identify the most compelling technical fact, number, or case study from the original email (e.g., "$50k/month", "40% reduction", "Acme Corp"). Double down on this fact.
- ASYMMETRIC PERSISTENCE: Each message should be shorter than the last. Step 3 should be no more than 20 words.
- TECHNICAL TONE: Speak like a project manager or engineer, not a salesperson. Be direct and objective.
- THREAD CONTINUITY: Subjects must feel like a logical continuation of the original subject.`;

  const prompt = `Generate a 3-step surgical follow-up sequence.

ORIGINAL EMAIL CONTEXT:
Subject: ${subject}
Body: ${body}
Recipient: ${recipient}
Sender: ${sender}
${customVariables ? `CUSTOM CONTEXT: ${JSON.stringify(customVariables)}` : ""}

CONSTRUCTION RULES:
1. Step 1 (2 Days): Anchor on the strongest technical/financial claim from the original. Question if that specific bottleneck is still a priority.
2. Step 2 (3 Days): Reference the specific case study or number from the original. Lower friction.
3. Step 3 (4 Days): The "Graceful Exit". Acknowledging that the priority might have shifted. Very short.

BANNED WORDS: "I hope", "just", "checking", "bumping", "thoughts", "interest", "explore", "opportunity", "discuss".

OUTPUT FORMAT (JSON Array):
[
  {
    "stepNumber": 1,
    "subject": "Short variation of original subject",
    "body": "Body text (No fluff, straight to the technical anchor)",
    "waitDays": 2,
    "contextSnippet": "Technical anchor used"
  },
  ...
]`;

  try {
    const response = await callAI(prompt, systemPrompt);

    try {
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (parseError) {
      console.error("[AIFollowUp] Failed to parse AI response:", parseError);
    }
  } catch (aiError) {
    console.error("[AIFollowUp] AI call failed:", aiError);
  }

  return getDefaultFollowUps(context);
}

function getDefaultFollowUps(context: FollowUpContext): GeneratedFollowUp[] {
  const { subject, recipientName, senderName } = context;
  const recipient = recipientName || "there";
  const sender = senderName || "me";
  const firstName = recipient.split(" ")[0];

  return [
    {
      stepNumber: 1,
      subject: `Following up on my last email`,
      body: `Hi ${firstName},

Just wanted to check if you had a chance to see my earlier email. Happy to answer any questions or hop on a quick call if that would help.

Best,
${sender}`,
      waitDays: 2,
    },
    {
      stepNumber: 2,
      subject: `Thoughts?`,
      body: `Hi ${firstName},

Curious if this is of interest, or if I'm reaching out at a bad time. Let me know either way - no worries at all if it's not a fit.

Best,
${sender}`,
      waitDays: 3,
    },
    {
      stepNumber: 3,
      subject: `One last thought`,
      body: `Hi ${firstName},

Last note from me on this - if there's something useful here, I'd love to chat. If not, I hope things are going well for you.

Best,
${sender}`,
      waitDays: 4,
    },
  ];
}
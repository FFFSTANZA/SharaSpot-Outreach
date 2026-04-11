import { Router, Request, Response } from "express";
import { analyzeSpamScore } from "../utils/spamDetector";
import { generateCalendlyUrl, verifyCalendlyLink } from "../utils/calendlyIntegration";

const router = Router();

// ---------------------------------------------------------------------------
// SPAM CHECK ENDPOINT
// ---------------------------------------------------------------------------
// POST /api/premium/analyze-spam
// Body: { subject: string, body: string, html?: string }
// Returns: { score: number, level: string, checks: [], suggestions: [] }
// ---------------------------------------------------------------------------
router.post(
  "/analyze-spam",
  async (req: Request, res: Response) => {
    try {
      const { subject, body, html } = req.body as {
        subject?: string;
        body?: string;
        html?: string;
      };

      if (!subject && !body) {
        return res.status(400).json({
          error: "At least subject or body is required",
        });
      }

      const result = analyzeSpamScore(
        subject || "",
        body || "",
        html
      );

      res.json(result);
    } catch (error) {
      console.error("[SPAM ANALYZE ERROR]", error);
      res.status(500).json({ error: "Failed to analyze spam score" });
    }
  }
);

// ---------------------------------------------------------------------------
// CALENDLY LINK GENERATOR
// ---------------------------------------------------------------------------
// POST /api/premium/calendly/generate
// Body: { username: string, eventType?: string, prefill?: { name, email, company } }
// Returns: { url: string, button: { html, text } }
// ---------------------------------------------------------------------------
router.post(
  "/calendly/generate",
  async (req: Request, res: Response) => {
    try {
      const { username, eventType, prefill } = req.body as {
        username: string;
        eventType?: string;
        prefill?: {
          name?: string;
          email?: string;
          company?: string;
        };
      };

      if (!username) {
        return res.status(400).json({ error: "Username is required" });
      }

      const url = generateCalendlyUrl(
        { username, eventType },
        prefill || {}
      );

      const button = prefill
        ? {
            html: `<a href="${url}" style="display:inline-block;padding:12px 24px;background-color:#00A63E;color:#fff;text-decoration:none;border-radius:6px;font-weight:600;">Book a Time</a>`,
            text: `Book a time: ${url}`,
          }
        : { html: "", text: "" };

      res.json({ url, button });
    } catch (error) {
      console.error("[CALENDLY GEN ERROR]", error);
      res.status(500).json({ error: "Failed to generate Calendly URL" });
    }
  }
);

// ---------------------------------------------------------------------------
// CALENDLY LINK VERIFIER
// ---------------------------------------------------------------------------
// POST /api/premium/calendly/verify
// Body: { calendlyUrl: string, apiToken?: string }
// Returns: { valid: boolean, username?: string, eventType?: string }
// ---------------------------------------------------------------------------
router.post(
  "/calendly/verify",
  async (req: Request, res: Response) => {
    try {
      const { calendlyUrl, apiToken } = req.body as {
        calendlyUrl: string;
        apiToken?: string;
      };

      if (!calendlyUrl) {
        return res.status(400).json({ error: "Calendly URL is required" });
      }

      const result = verifyCalendlyLink(calendlyUrl, apiToken);

      res.json(result);
    } catch (error) {
      console.error("[CALENDLY VERIFY ERROR]", error);
      res.status(500).json({ error: "Failed to verify Calendly link" });
    }
  }
);

// ---------------------------------------------------------------------------
// WEBHOOK HANDLER for Calendly events
// ---------------------------------------------------------------------------
// POST /api/premium/calendly/webhook
// Headers: Calendly-Signature (for verification)
// Body: Calendly webhook payload
// ---------------------------------------------------------------------------
router.post(
  "/calendly/webhook",
  async (req: Request, res: Response) => {
    try {
      const { event, payload } = req.body as {
        event: string;
        payload: {
          invitee: {
            email: string;
            name: string;
          };
          scheduling_link?: {
            name?: string;
          };
        };
      };

      // Verify webhook signature if token is configured
      const webhookToken = process.env.CALENDLY_WEBHOOK_SECRET;
      const signature = req.headers["calendly-signature"] as string;

      if (webhookToken && signature !== webhookToken) {
        console.warn("[CALENDLY WEBHOOK] Invalid signature");
        return res.status(401).json({ error: "Invalid signature" });
      }

      if (event === "invitee.created") {
        // Meeting was booked
        console.log("[CALENDLY] Meeting booked:", {
          email: payload.invitee.email,
          name: payload.invitee.name,
          event: payload.scheduling_link?.name,
        });
      } else if (event === "invitee.canceled") {
        // Meeting was cancelled
        console.log("[CALENDLY] Meeting cancelled:", {
          email: payload.invitee.email,
          name: payload.invitee.name,
        });
      }

      res.json({ received: true });
    } catch (error) {
      console.error("[CALENDLY WEBHOOK ERROR]", error);
      res.status(500).json({ error: "Webhook processing failed" });
    }
  }
);

export default router;
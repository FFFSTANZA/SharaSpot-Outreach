export type SenderProviderKey = "gmail" | "outlook" | "zoho" | "yahoo" | "custom";

export interface SenderProviderConfig {
  key: SenderProviderKey;
  label: string;
  smtpHost: string;
  smtpPort: number;
  instructions: string[];
}

export const SENDER_PROVIDERS: SenderProviderConfig[] = [
  {
    key: "gmail",
    label: "Gmail",
    smtpHost: "smtp.gmail.com",
    smtpPort: 465,
    instructions: [
      "Enable 2-Step Verification in your Google account.",
      "Generate an App Password from myaccount.google.com/apppasswords.",
      "Paste the 16-character App Password here.",
    ],
  },
  {
    key: "outlook",
    label: "Outlook",
    smtpHost: "smtp.office365.com",
    smtpPort: 587,
    instructions: [
      "Enable multi-factor authentication for the mailbox.",
      "Create an app password from Microsoft security settings.",
      "Use that app password in this form.",
    ],
  },
  {
    key: "zoho",
    label: "Zoho",
    smtpHost: "smtp.zoho.com",
    smtpPort: 587,
    instructions: [
      "Turn on MFA in Zoho Account security.",
      "Generate an application-specific password.",
      "Use the generated password here.",
    ],
  },
  {
    key: "yahoo",
    label: "Yahoo",
    smtpHost: "smtp.mail.yahoo.com",
    smtpPort: 465,
    instructions: [
      "Enable 2-step verification in Yahoo Account Security.",
      "Generate an app password for Mail.",
      "Paste the generated app password here.",
    ],
  },
  {
    key: "custom",
    label: "Company/Custom",
    smtpHost: "",
    smtpPort: 587,
    instructions: [
      "Use the SMTP host/port provided by your IT or email provider.",
      "Use your mailbox app password (or SMTP password) for authentication.",
      "Port 465 usually uses SSL, and port 587 usually uses STARTTLS.",
    ],
  },
];

export function getProviderConfig(providerKey: SenderProviderKey): SenderProviderConfig {
  return SENDER_PROVIDERS.find((provider) => provider.key === providerKey) ?? SENDER_PROVIDERS[0];
}

export function inferProviderFromHost(host?: string | null): SenderProviderKey {
  const normalized = (host || "").toLowerCase();
  if (normalized.includes("smtp.gmail.com")) return "gmail";
  if (normalized.includes("smtp.office365.com") || normalized.includes("smtp-mail.outlook.com")) return "outlook";
  if (normalized.includes("smtp.zoho.")) return "zoho";
  if (normalized.includes("smtp.mail.yahoo.com")) return "yahoo";
  return "custom";
}

export function getConnectionSecurityHint(port: number): string {
  if (port === 465) return "Security: SSL/TLS (implicit TLS)";
  if (port === 587) return "Security: STARTTLS (recommended)";
  return "Security depends on your provider settings";
}

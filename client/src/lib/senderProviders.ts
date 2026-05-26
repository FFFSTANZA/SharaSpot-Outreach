export type SenderProviderKey = "gmail" | "outlook" | "zoho" | "yahoo" | "custom";

export interface InstructionItem {
  text: string;
  href?: string;
}

export interface SenderProviderConfig {
  key: SenderProviderKey;
  label: string;
  smtpHost: string;
  smtpPort: number;
  instructions: InstructionItem[];
}

export const SENDER_PROVIDERS: SenderProviderConfig[] = [
  {
    key: "gmail",
    label: "Gmail",
    smtpHost: "smtp.gmail.com",
    smtpPort: 465,
    instructions: [
      { text: "Enable 2-Step Verification in your Google account." },
      { text: "Generate an App Password", href: "https://myaccount.google.com/apppasswords" },
      { text: "Paste the 16-character App Password here." },
    ],
  },
  {
    key: "outlook",
    label: "Outlook",
    smtpHost: "smtp.office365.com",
    smtpPort: 587,
    instructions: [
      { text: "Enable multi-factor authentication for the mailbox." },
      { text: "Create an app password", href: "https://account.microsoft.com/security" },
      { text: "Use that app password in this form." },
    ],
  },
  {
    key: "zoho",
    label: "Zoho",
    smtpHost: "smtp.zoho.com",
    smtpPort: 587,
    instructions: [
      { text: "Turn on MFA in Zoho Account security." },
      { text: "Generate an application-specific password", href: "https://accounts.zoho.com/security" },
      { text: "Use the generated password here." },
    ],
  },
  {
    key: "yahoo",
    label: "Yahoo",
    smtpHost: "smtp.mail.yahoo.com",
    smtpPort: 465,
    instructions: [
      { text: "Enable 2-step verification in Yahoo Account Security." },
      { text: "Generate an app password for Mail", href: "https://login.yahoo.com/account/security" },
      { text: "Paste the generated app password here." },
    ],
  },
  {
    key: "custom",
    label: "Company/Custom",
    smtpHost: "",
    smtpPort: 587,
    instructions: [
      { text: "Use the SMTP host/port provided by your IT or email provider." },
      { text: "Use your mailbox app password (or SMTP password) for authentication." },
      { text: "Port 465 usually uses SSL, and port 587 usually uses STARTTLS." },
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

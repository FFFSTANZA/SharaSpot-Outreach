export type SenderProviderKey = "gmail" | "outlook" | "zoho" | "yahoo" | "custom";

export interface ProviderSmtpDefaults {
  smtpHost: string;
  smtpPort: number;
}

const PROVIDER_DEFAULTS: Record<Exclude<SenderProviderKey, "custom">, ProviderSmtpDefaults> = {
  gmail: { smtpHost: "smtp.gmail.com", smtpPort: 465 },
  outlook: { smtpHost: "smtp.office365.com", smtpPort: 587 },
  zoho: { smtpHost: "smtp.zoho.com", smtpPort: 587 },
  yahoo: { smtpHost: "smtp.mail.yahoo.com", smtpPort: 465 },
};

const PROVIDER_BY_HOST: Array<{ match: RegExp; key: SenderProviderKey }> = [
  { match: /smtp\.gmail\.com$/i, key: "gmail" },
  { match: /smtp\.office365\.com$/i, key: "outlook" },
  { match: /smtp-mail\.outlook\.com$/i, key: "outlook" },
  { match: /smtp\.zoho\.[a-z.]+$/i, key: "zoho" },
  { match: /smtp\.mail\.yahoo\.com$/i, key: "yahoo" },
];

export function isSenderProviderKey(value: unknown): value is SenderProviderKey {
  return value === "gmail" || value === "outlook" || value === "zoho" || value === "yahoo" || value === "custom";
}

export function resolveProviderSmtp(
  providerKey: SenderProviderKey | undefined,
  smtpHost: unknown,
  smtpPort: unknown,
  fallbackHost = "smtp.gmail.com",
  fallbackPort = 465
): ProviderSmtpDefaults {
  const preset = providerKey && providerKey !== "custom" ? PROVIDER_DEFAULTS[providerKey] : undefined;
  const host = typeof smtpHost === "string" && smtpHost.trim() ? smtpHost.trim() : preset?.smtpHost ?? fallbackHost;
  const portNumber = typeof smtpPort === "number" ? smtpPort : Number(smtpPort);
  const port = Number.isFinite(portNumber) && portNumber > 0 ? portNumber : preset?.smtpPort ?? fallbackPort;
  return { smtpHost: host, smtpPort: port };
}

export function inferProviderKeyFromHost(smtpHost: string | null | undefined): SenderProviderKey {
  if (!smtpHost) return "custom";
  const lowerHost = smtpHost.toLowerCase();
  const matched = PROVIDER_BY_HOST.find(({ match }) => match.test(lowerHost));
  return matched?.key ?? "custom";
}

export function classifySmtpError(error: unknown): string {
  const rawMessage = (error as any)?.message || "SMTP verification failed";
  const message = String(rawMessage).toLowerCase();
  const code = String((error as any)?.code || "").toLowerCase();
  const responseCode = Number((error as any)?.responseCode ?? 0);

  if (
    code.includes("etimedout") ||
    code.includes("econnreset") ||
    code.includes("ehostunreach") ||
    code.includes("enotfound") ||
    message.includes("timeout")
  ) {
    return "Connection timeout. Please retry in a moment or check firewall/network rules.";
  }

  if (
    code.includes("eauth") ||
    responseCode === 535 ||
    responseCode === 534 ||
    message.includes("invalid login") ||
    message.includes("authentication failed")
  ) {
    return "Authentication failed. Use an app password and verify your email/password pair.";
  }

  if (
    responseCode === 530 ||
    responseCode === 534 ||
    message.includes("2-step") ||
    message.includes("2fa") ||
    message.includes("application-specific")
  ) {
    return "Provider blocked sign-in. Enable 2FA and generate an app password for this mailbox.";
  }

  if (
    code.includes("econnrefused") ||
    message.includes("wrong version number") ||
    message.includes("ssl routines") ||
    message.includes("unable to establish tls")
  ) {
    return "SMTP host/port mismatch. Confirm the server, port, and SSL/STARTTLS settings.";
  }

  return `SMTP verification failed: ${rawMessage}`;
}

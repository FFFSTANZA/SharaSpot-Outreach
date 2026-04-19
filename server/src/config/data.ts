/**
 * Static data for email validation and spam detection.
 */

export const FREE_EMAIL_DOMAINS = new Set([
    "gmail.com", "googlemail.com", "yahoo.com", "yahoo.co.uk", "yahoo.com.au", "yahoo.in", "ymail.com",
    "hotmail.com", "hotmail.co.uk", "live.com", "outlook.com", "msn.com", "windowslive.com",
    "aol.com", "aim.com", "icloud.com", "me.com", "mac.com",
    "mail.com", "gmx.com", "gmx.de", "gmx.net", "gmx.ch",
    "protonmail.com", "protonmail.ch", "pm.me",
    "zoho.com", "yandex.com", "yandex.ru", "qq.com", "163.com",
    "web.de", "gmx.at", "t-online.de",
]);

export const DISPOSABLE_DOMAINS = new Set([
    "tempmail.com", "throwaway.email", "guerrillamail.com", "mailinator.com",
    "10minutemail.com", "temp-mail.org", "fakeinbox.com", "trashmail.com",
    "getnada.com", "mohmal.com", "tempail.com", "dispostable.com",
    "yopmail.com", "sharklasers.com", "guerrillamailblock.com", "pokemail.net",
    "spam4.me", "grr.la", "discard.email", "discardmail.com", "spamgourmet.com",
]);

export const SUSPICIOUS_TLDS = new Set([
    "xyz", "top", "club", "online", "site", "website", "space", "work", "tk",
    "ml", "ga", "cf", "gq", "pw", "cc", "su", "racing", "win", "bid", "date",
]);

export const ROLE_BASED_KEYWORDS = [
    "info", "support", "sales", "contact", "hello", "admin", "webmaster",
    "postmaster", "noreply", "team", "help", "careers", "jobs", "hr",
];

export const SPAM_TRIGGERS: Record<string, number> = {
    "urgent": 8, "act now": 10, "limited time": 8, "expires": 6, "don't wait": 10,
    "free": 5, "free money": 15, "make cash": 15, "cash bonus": 12, "$$$": 12,
    "guaranteed": 8, "no experience": 8, "work from home": 10, "financial freedom": 10,
    "click here": 8, "buy now": 10, "order now": 10, "prize": 12, "winner": 12,
};

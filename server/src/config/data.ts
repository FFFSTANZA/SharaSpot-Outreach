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
    "mail.ru", "inbox.ru", "list.ru", "bk.ru", "corp.mail.ru",
    "rediffmail.com", "rediff.com",
    "fastmail.com", "fastmail.fm",
    "tutanota.com", "tuta.io",
    "hey.com",
    "mailfence.com",
    "posteo.de",
    "runbox.com",
]);

export const DISPOSABLE_DOMAINS = new Set([
    "tempmail.com", "throwaway.email", "guerrillamail.com", "mailinator.com",
    "10minutemail.com", "temp-mail.org", "fakeinbox.com", "trashmail.com",
    "getnada.com", "mohmal.com", "tempail.com", "dispostable.com",
    "yopmail.com", "sharklasers.com", "guerrillamailblock.com", "pokemail.net",
    "spam4.me", "grr.la", "discard.email", "discardmail.com", "spamgourmet.com",
    "tempmailo.com", "tempr.email", "maildrop.cc", "mailnesia.com",
    "mailcatch.com", "mailscrap.com", "mailexpire.com", "mailinator2.com",
    "mailinator.net", "mailinator.org", "mailin8r.com", "mailnesia.com",
    "mintemail.com", "mytemp.email", "meltmail.com", "33mail.com",
    "spamfree24.org", "spamfree24.com", "spamfree24.de", "spamfree24.net",
    "trash-mail.com", "trashmail.de", "trashmail.me", "trashmail.net",
    "wegwerfmail.de", "wegwerfmail.net", "wegwerfmail.org",
    "binkmail.com", "bobmail.info", "chammy.info", "devnullmail.com",
    "filzmail.com", "inboxalias.com", "letthemeatspam.com", "mailnull.com",
    "safe-mail.net", "sendspamhere.com", "spamavert.com", "spamcorptastic.com",
    "spameater.com", "spameater.org", "spamhole.com", "spamify.com",
    "spaml.com", "spamthisplease.com", "suremail.info", "veryrealemail.com",
    "emailondeck.com", "crazymailing.com", "burnermail.io", "guerrillamail.info",
    "guerrillamail.net", "guerrillamail.org", "guerrillamail.de",
    "harakirimail.com", "jetable.org", "mailzilla.com", "mailzilla.org",
    "mytrashmail.com", "no-spam.ws", "nospam.ze.tc", "nowmymail.com",
    "objectmail.com", "proxymail.eu", "rcpt.at", "spamgourmet.net",
    "spamgourmet.org", "spamhere.com", "spamthis.com", "trashymail.com",
    "wegwerfmailadresse.de", "zehnminutenmail.de",
]);

export const SUSPICIOUS_TLDS = new Set([
    "xyz", "top", "club", "online", "site", "website", "space", "work", "tk",
    "ml", "ga", "cf", "gq", "pw", "cc", "su", "racing", "win", "bid", "date",
    "stream", "download", "loan", "review", "trade", "faith", "science",
    "party", "cricket", "racing", "review", "accountant", "click",
]);

export const ROLE_BASED_KEYWORDS = [
    "info", "support", "sales", "contact", "hello", "admin", "webmaster",
    "postmaster", "noreply", "team", "help", "careers", "jobs", "hr",
    "billing", "marketing", "press", "media", "office", "reception",
    "enquiries", "feedback", "compliance", "abuse", "security",
    "operations", "management", "staff", "exec", "director",
    "ceo", "cfo", "cto", "coo", "vp", "president",
    "registrar", "admissions", "registrar", "alumni",
    "donotreply", "no-reply", "donotreply", "do-not-reply",
];

export const SPAM_TRIGGERS: Record<string, number> = {
    "urgent": 8, "act now": 10, "limited time": 8, "expires": 6, "don't wait": 10,
    "free!": 8, "free money": 15, "make cash": 15, "cash bonus": 12, "$$$": 12,
    "guaranteed": 8, "no experience": 8, "work from home": 10, "financial freedom": 10,
    "click here": 8, "buy now": 10, "order now": 10, "prize": 12, "winner": 12,
};

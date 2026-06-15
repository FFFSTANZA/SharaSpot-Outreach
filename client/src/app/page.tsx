import { BRAND_CONFIG } from "@/lib/config";
import { SITE_NAME, SITE_URL, absoluteUrl, buildPageMetadata } from "@/lib/seo";
import LandingPageClient from "@/components/landing/LandingPageClient";

export const metadata = buildPageMetadata({
  title: "Cold Outreach Platform for Founders, Sales Teams, Recruiters, and Partner Teams",
  description:
    "SharaSpot is a cold outreach platform that helps teams protect deliverability, rotate senders, warm up accounts, track engagement, and stop follow-ups when replies arrive.",
  path: "/",
  keywords: [
    "cold outreach platform",
    "cold email software",
    "cold email deliverability tool",
    "sales outreach software",
    "founder investor outreach software",
    "recruiting outreach tool",
    "partner relationship management software",
    "sender rotation software",
    "email warmup software",
  ],
});

const homeJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebPage",
      "@id": `${SITE_URL}/#home`,
      "url": SITE_URL,
      "name": `${SITE_NAME} homepage`,
      "description": "Cold outreach software for deliverability, reply rates, and safer sender operations.",
      "about": {
        "@type": "SoftwareApplication",
        "name": SITE_NAME,
      },
      "primaryImageOfPage": {
        "@type": "ImageObject",
        "url": absoluteUrl("/og-image.jpg"),
      },
      "speakable": {
        "@type": "SpeakableSpecification",
        "cssSelector": ["h1", "h2", "h3"]
      }
    },
    {
      "@type": "ItemList",
      "name": "SharaSpot resource hub",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "name": "Cold Outreach Guide",
          "url": absoluteUrl("/guide"),
        },
        {
          "@type": "ListItem",
          "position": 2,
          "name": "Deliverability FAQ",
          "url": absoluteUrl("/faq"),
        },
        {
          "@type": "ListItem",
          "position": 3,
          "name": "Priority Delivery Research",
          "url": absoluteUrl("/priority"),
        },
      ],
    },
    {
      "@type": "ItemList",
      "name": "Who SharaSpot is for",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "name": "Founders doing investor outreach",
        },
        {
          "@type": "ListItem",
          "position": 2,
          "name": "Sales teams running outbound prospecting",
        },
        {
          "@type": "ListItem",
          "position": 3,
          "name": "Recruiters sourcing candidates",
        },
        {
          "@type": "ListItem",
          "position": 4,
          "name": "Partner teams managing relationship pipelines",
        }
      ]
    },
    {
      "@type": "Offer",
      "name": `${SITE_NAME} free trial`,
      "url": absoluteUrl("/login"),
      "price": "0",
      "priceCurrency": BRAND_CONFIG.pricing.global.currency,
      "description": `Start with a ${BRAND_CONFIG.pricing.trialDays}-day free trial, then ${BRAND_CONFIG.pricing.global.symbol}${BRAND_CONFIG.pricing.global.amount}/month.`,
      "eligibleDuration": `P${BRAND_CONFIG.pricing.trialDays}D`
    },
  ],
};

export default function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(homeJsonLd).replace(/</g, "\\u003c"),
        }}
      />
      <LandingPageClient />
    </>
  );
}

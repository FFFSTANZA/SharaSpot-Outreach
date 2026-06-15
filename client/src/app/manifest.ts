import type { MetadataRoute } from "next";
import { SITE_NAME, SITE_URL } from "@/lib/seo";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: SITE_NAME,
    short_name: SITE_NAME,
    description:
      "Cold outreach platform for deliverability, sender rotation, warmup, reply detection, and pipeline-focused outreach workflows.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#ffffff",
    categories: ["business", "productivity", "marketing"],
    icons: [
      {
        src: "/sharaspot-icon.png",
        sizes: "128x128",
        type: "image/png",
      },
    ],
    id: SITE_URL,
  };
}

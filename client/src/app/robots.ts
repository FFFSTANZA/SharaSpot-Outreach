import { MetadataRoute } from 'next';
import { SITE_URL } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
    return {
        rules: [
            {
                userAgent: '*',
                allow: '/',
                disallow: [
                    '/dashboard',
                    '/api',
                    '/auth',
                    '/senders',
                    '/campaigns',
                    '/emails',
                    '/attachments',
                    '/templates',
                    '/track',
                    '/test-login',
                ],
            },
            {
                userAgent: ['GPTBot', 'CCBot', 'anthropic-ai', 'Claude-Web', 'Google-Extended'],
                allow: '/',
            },
        ],
        sitemap: `${SITE_URL}/sitemap.xml`,
        host: SITE_URL,
    };
}

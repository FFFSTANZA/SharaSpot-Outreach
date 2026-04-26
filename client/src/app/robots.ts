import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
    const baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "https://sharaspot.in";

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
                ],
            },
            {
                userAgent: ['GPTBot', 'CCBot', 'anthropic-ai', 'Claude-Web', 'Google-Extended'],
                allow: '/',
            },
        ],
        sitemap: `${baseUrl}/sitemap.xml`,
    };
}

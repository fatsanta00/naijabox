import { getAllBoxes } from '@/boxes/registry';
import { MetadataRoute } from 'next';
import { SlangService } from '@/server/services/slangService';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.SITE_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://naijabox.app';
  const boxes = getAllBoxes();

  const boxUrls: MetadataRoute.Sitemap = boxes.map((box) => ({
    url: `${baseUrl}/boxes/${box.slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  const staticUrls: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.4,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.4,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/slang`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
  ];

  // Dynamically include all published slang terms for SEO
  let slangUrls: MetadataRoute.Sitemap = [];
  try {
    const slangTerms = await SlangService.getAllTerms();
    slangUrls = slangTerms.map((t) => ({
      url: `${baseUrl}/slang/${t.slug}`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.6,
    }));
  } catch {
    // Graceful fallback during isolated builds
  }

  return [...staticUrls, ...boxUrls, ...slangUrls];
}

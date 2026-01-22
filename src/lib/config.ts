import yaml from 'js-yaml';
import fs from 'node:fs';
import path from 'node:path';

export interface SiteConfig {
  site: {
    name: string;
    description: string;
    language: string;
  };
  author: {
    name: string;
    bio: string;
    avatar: string;
  };
  social: {
    twitter?: string;
    github?: string;
    mastodon?: string;
    linkedin?: string;
    bluesky?: string;
  };
  links: Array<{
    label: string;
    url: string;
  }>;
  feed: {
    postsPerPage: number;
  };
}

let cachedConfig: SiteConfig | null = null;

export function getConfig(): SiteConfig {
  if (cachedConfig) {
    return cachedConfig;
  }

  const configPath = path.join(process.cwd(), 'src', 'config.yml');
  const configContent = fs.readFileSync(configPath, 'utf-8');
  cachedConfig = yaml.load(configContent) as SiteConfig;

  return cachedConfig;
}

export function getSocialLinks(): Array<{ platform: string; url: string; icon: string }> {
  const config = getConfig();
  const links: Array<{ platform: string; url: string; icon: string }> = [];

  const socialIcons: Record<string, string> = {
    twitter: 'twitter',
    github: 'github',
    mastodon: 'mastodon',
    linkedin: 'linkedin',
    bluesky: 'bluesky',
  };

  for (const [platform, url] of Object.entries(config.social || {})) {
    if (url) {
      links.push({
        platform,
        url,
        icon: socialIcons[platform] || platform,
      });
    }
  }

  return links;
}

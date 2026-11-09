import type { APIRoute } from 'astro';
import { brand } from '../lib/brand';
import { robotsTxt } from '../lib/seo';

export const GET: APIRoute = () =>
  new Response(robotsTxt(brand.identity.siteUrl.replace(/\/$/, '')), { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });

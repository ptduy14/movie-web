import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';

/**
 * Self-hosted replacement for Vercel's metered Image Optimization API.
 * Consumed exclusively via image-loader.ts (next/image). Must independently
 * validate host + width here too, since this endpoint is reachable directly
 * (curl etc.) regardless of what next/image's remotePatterns allow.
 */

const ALLOWED_HOSTS = new Set([
  'img.ophim.live',
  'image.tmdb.org',
  'lh3.googleusercontent.com',
]);

// Next.js default imageSizes + deviceSizes — keep in sync with next.config.mjs.
const ALLOWED_WIDTHS = new Set([
  16, 32, 48, 64, 96, 128, 256, 384, 640, 750, 828, 1080, 1200, 1920, 2048,
  3840,
]);

const FETCH_TIMEOUT_MS = 8000;
const CACHE_CONTROL = 'public, max-age=7776000, immutable'; // 90 days

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const rawUrl = searchParams.get('url');
  const rawWidth = searchParams.get('w');
  const rawQuality = searchParams.get('q');

  if (!rawUrl || !rawWidth) {
    return NextResponse.json({ message: 'missing url or w' }, { status: 400 });
  }

  // rawUrl is either an absolute remote URL (movie posters from OPhim/TMDB/
  // Google) or a same-origin relative path (local/static images bundled by
  // Next itself, e.g. /_next/static/media/*) — next/image sends both through
  // the same custom loader, so both must be handled here.
  let source: URL;
  try {
    source = new URL(rawUrl, request.nextUrl.origin);
  } catch {
    return NextResponse.json({ message: 'invalid url' }, { status: 400 });
  }

  const isSameOrigin = source.origin === request.nextUrl.origin;
  if (!isSameOrigin && (source.protocol !== 'https:' || !ALLOWED_HOSTS.has(source.hostname))) {
    return NextResponse.json({ message: 'host not allowed' }, { status: 400 });
  }

  const width = Number(rawWidth);
  if (!ALLOWED_WIDTHS.has(width)) {
    return NextResponse.json({ message: 'width not allowed' }, { status: 400 });
  }

  const quality = Math.min(100, Math.max(1, Number(rawQuality) || 75));

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    const sourceRes = await fetch(source, { signal: controller.signal });
    clearTimeout(timeout);

    if (!sourceRes.ok || !sourceRes.headers.get('content-type')?.startsWith('image/')) {
      return NextResponse.json({ message: 'source fetch failed' }, { status: 502 });
    }

    const inputBuffer = Buffer.from(await sourceRes.arrayBuffer());
    const outputBuffer = await sharp(inputBuffer)
      .resize({ width, withoutEnlargement: true })
      .webp({ quality })
      .toBuffer();

    return new NextResponse(outputBuffer, {
      headers: {
        'Content-Type': 'image/webp',
        'Cache-Control': CACHE_CONTROL,
      },
    });
  } catch (error: any) {
    console.error('image proxy error:', error.message);
    return NextResponse.json({ message: 'error' }, { status: 500 });
  }
}

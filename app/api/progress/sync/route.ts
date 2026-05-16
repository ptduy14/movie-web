import { db } from 'lib/firebase-admin';
import { NextRequest, NextResponse } from 'next/server';
import type { IRecentMovie } from 'types/recent-movie';

/**
 * sendBeacon target for last-gasp progress saves during `pagehide` (tab/browser
 * close). After the 2026-05-16 storage consolidation this writes to
 * `recentMovies/{userId}/movies/{movieId}` — the single source of truth for
 * both resume prompt and Continue Watching reads.
 *
 * Payload shape:
 *   { userId: string, movie: IRecentMovie }
 *
 * The full `IRecentMovie` (metadata + progress) is sent so the merged doc
 * has everything it needs on FIRST save, in case the user closes the tab
 * before any periodic save has fired.
 */
export async function POST(request: NextRequest) {
  try {
    const text = await request.text();
    const { userId, movie } = JSON.parse(text) as {
      userId?: string;
      movie?: IRecentMovie;
    };

    if (!userId || !movie?.id) {
      return NextResponse.json({ message: 'missing fields' }, { status: 400 });
    }

    await db
      .collection('recentMovies')
      .doc(userId)
      .collection('movies')
      .doc(movie.id)
      .set({ ...movie, userId, updatedAt: Date.now() }, { merge: true });

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error('progress sync error:', error.message);
    return NextResponse.json({ message: 'error' }, { status: 500 });
  }
}

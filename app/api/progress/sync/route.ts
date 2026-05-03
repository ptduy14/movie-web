import { db } from 'lib/firebase-admin';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const text = await request.text();
    const { userId, movieId, position, episodeIndex, episodeLink } = JSON.parse(text);

    if (!userId || !movieId) {
      return NextResponse.json({ message: 'missing fields' }, { status: 400 });
    }

    await db
      .collection('viewing_progress')
      .doc(`${userId}_${movieId}`)
      .set({ position, episodeIndex, episodeLink, updatedAt: new Date() });

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error('progress sync error:', error.message);
    return NextResponse.json({ message: 'error' }, { status: 500 });
  }
}

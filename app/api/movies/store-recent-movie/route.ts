import { db } from 'lib/firebase-admin';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const textData = await request.text();
  const data = JSON.parse(textData);

  const { userId, ...movie } = data;

  try {
    // Reference to a document in Firestore Admin SDK
    const userRecentMovieDocRef = db
      .collection('recentMovies')
      .doc(userId)
      .collection('movies')
      .doc(movie.id);

    await userRecentMovieDocRef.set(movie, { merge: true });

    return NextResponse.json({ message: 'success' }, { status: 200 });
  } catch (error: any) {
    console.error(error.message);
    return NextResponse.json({ message: 'error' }, { status: 500 });
  }
}

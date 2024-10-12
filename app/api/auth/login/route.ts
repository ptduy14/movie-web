import { auth, db } from 'configs/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const data = await request.json();

    await signInWithEmailAndPassword(auth, data.email, data.password);
    const user = auth.currentUser;

    const idTokenResult = await user!.getIdTokenResult();
    const accessToken = idTokenResult.token;
    const expirationTime = idTokenResult.expirationTime;
    const refreshToken = user!.refreshToken;

    // get more info form firestore
    const docRef = doc(db, "Users", user!.uid);
    const docSnap = await getDoc(docRef);
    const userData = docSnap.data();

    // create new response body
    const responseUserData = {
      uid: user!.uid,
      ...userData,
      accessToken,
      refreshToken
    }

    const response = NextResponse.json({ responseUserData }, { status: 200 });

    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // Chỉ kích hoạt secure khi production
      expires: new Date(expirationTime),
      path: '/',
    };

    response.cookies.set('accessToken', accessToken, cookieOptions);
    response.cookies.set('refreshToken', refreshToken, cookieOptions);

    return response;
  } catch (error: any) {
    return NextResponse.json(
      {
        code: error.code,
        message: error.message || 'Something went wrong',
      },
      { status: 500 }
    );
  }
}

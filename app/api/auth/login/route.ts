import { auth } from 'configs/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
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

    const response = NextResponse.json({ user }, { status: 200 });

    const cookieOption = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // Chỉ kích hoạt secure khi production
      expires: new Date(expirationTime),
      path: '/',
    };

    response.cookies.set('accessToken', accessToken, cookieOption);
    response.cookies.set('refreshToken', refreshToken, cookieOption);

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

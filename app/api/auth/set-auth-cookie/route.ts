import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const data = await request.json();

    const response = NextResponse.json('success', { status: 200 });
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // Chỉ kích hoạt secure khi production
      path: '/',
      maxAge: 30 * 24 * 60 * 60,
    };

    response.cookies.set('accessToken', data.accessToken, cookieOptions);
    response.cookies.set('refreshToken', data.refreshToken, cookieOptions);

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

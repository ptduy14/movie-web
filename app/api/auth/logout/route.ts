import { NextResponse } from 'next/server';

export async function GET() {
  // Xóa cookie bằng cách thiết lập thời gian hết hạn trong quá khứ
  const response = NextResponse.json({ message: 'Đăng xuất thành công' }, {status: 200});

  const cookieOptions = {
    httpOnly: true, // Cookie chỉ có thể được truy cập bởi máy chủ
    secure: process.env.NODE_ENV === 'production', // Chỉ sử dụng HTTPS trong môi trường production
    path: '/', // Đường dẫn cookie
    expires: new Date(0), // Thiết lập thời gian hết hạn trong quá khứ
  };

  response.cookies.set('accessToken', '', cookieOptions);
  response.cookies.set('refreshToken', '', cookieOptions);

  return response;
}

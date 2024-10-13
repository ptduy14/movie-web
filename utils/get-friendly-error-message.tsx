export default function getFriendlyErrorMessage(errorCode: string): string {
  switch (errorCode) {
    case 'auth/invalid-credential':
      return 'Thông tin đăng nhập không hợp lệ';
    case 'auth/user-not-found':
      return 'Tài khoản không tồn tại.';
    case 'auth/wrong-password':
      return 'Mật khẩu không chính xác.';
    case 'auth/email-already-in-use':
      return 'Email này đã được sử dụng.';
    case 'auth/invalid-email':
      return 'Địa chỉ email không hợp lệ';
    // Thêm các mã lỗi khác nếu cần
    default:
      return 'Đã xảy ra lỗi. Vui lòng thử lại sau.';
  }
}

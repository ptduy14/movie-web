import { z } from 'zod';

export const signUpValidationSchema = z.object({
  name: z.string().min(1, { message: 'Tên tài khoản không được trống' }),
  email: z.string().min(1, { message: 'Email không được trống' }).email({ message: 'Địa chỉ email không hợp lệ' }),
  password: z.string().min(6, { message: 'Mật khẩu phải có ít nhất 6 ký tự' }),
});

export type signUpValidationSchemaType = z.infer<typeof signUpValidationSchema>;

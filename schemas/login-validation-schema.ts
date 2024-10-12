import { z } from 'zod';

export const loginValidationSchema = z.object({
  email: z.string().min(1, { message: 'Email không được trống' }).email({ message: 'Địa chỉ email không hợp lệ' }),
  password: z.string().min(1, { message: 'Mật khẩu không được trống' }),
});

export type LoginValidationSchemaType = z.infer<typeof loginValidationSchema>;

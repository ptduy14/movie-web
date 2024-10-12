import { SetStateAction } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { loginValidationSchema, LoginValidationSchemaType } from 'schemas/login-validation-schema';
import { zodResolver } from '@hookform/resolvers/zod';
import AuthServices from 'services/auth-services';
import getFriendlyErrorMessage from 'utils/get-friendly-error-message';
import { toast } from 'react-toastify';
import { useState } from 'react';
import LoadingSpinerBtn from '../loading/loading-spiner-btn';

export default function LoginForm({
  setRenderSignUpForm,
}: {
  setRenderSignUpForm: React.Dispatch<SetStateAction<boolean>>;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginValidationSchemaType>({ resolver: zodResolver(loginValidationSchema) });
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const onSubmit: SubmitHandler<LoginValidationSchemaType> = async (data) => {
    setIsLoading(true);
    try {
      const res = await AuthServices.login(data);

      if (!res.ok) {
        const dataError = await res.json();
        throw new Error(dataError.code || 'Đăng nhập thất bại');
      }

      const dataSuccess = await res.json();
      console.log(dataSuccess);

    } catch (error: any) {
      //console.log(error.message);
      toast.error(getFriendlyErrorMessage(error.message));
    } finally {
      setIsLoading(false)
    }
  };

  return (
    <>
      <h2 className="text-center text-white text-lg font-semibold mb-6">Đăng nhập khoản MovieX</h2>
      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)}>
        {/* Email Input */}
        <div className="mb-2">
          <label htmlFor="email" className="block text-gray-300 mb-1">
            Email:
          </label>
          <input
            type="text"
            id="email"
            className={`w-full p-2 border ${errors.email ? 'border-red-500' : 'border-slate-600'} 
                       bg-black text-white focus:outline-none focus:ring-2 
                       ${errors.email ? 'focus:ring-red-500' : 'focus:ring-[#e20913]'} rounded`}
            {...register('email')}
          />
          {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>}
        </div>
        {/* Password Input */}
        <div className="mb-6">
          <label htmlFor="password" className="block text-gray-300 mb-1">
            Mật khẩu:
          </label>
          <input
            type="password"
            id="password"
            className={`w-full p-2 border ${
              errors.password ? 'border-red-500' : 'border-slate-600'
            } 
                       bg-black text-white focus:outline-none focus:ring-2 
                       ${errors.password ? 'focus:ring-red-500' : 'focus:ring-[#e20913]'} rounded`}
            {...register('password')}
          />
          {errors.password && (
            <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>
          )}
        </div>
        {/* Submit Button */}
        <div className="flex justify-center mb-2">
          <button
            type="submit"
            className="bg-[#e20913] text-white rounded p-2 w-full hover:bg-red-600 transition duration-200"
          >
            {isLoading ? <LoadingSpinerBtn /> : "Đăng nhập"}
          </button>
        </div>
      </form>
      {/* Google Login Option */}
      <button
        type="button"
        className="bg-gray-800 text-white rounded p-2 w-full hover:bg-gray-700 transition duration-200"
      >
        Đăng nhập bằng Google
      </button>
      <div className="text-center mt-6">
        Bạn chưa có tài khoản?{' '}
        <span
          className="underline text-[#e20913] font-bold cursor-pointer"
          onClick={() => setRenderSignUpForm(true)}
        >
          Đăng ký
        </span>
      </div>
    </>
  );
}
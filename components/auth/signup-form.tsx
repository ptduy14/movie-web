import React, { SetStateAction, useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import {
  signUpValidationSchema,
  signUpValidationSchemaType,
} from 'schemas/signup-validation-schema';
import { zodResolver } from '@hookform/resolvers/zod';
import AuthServices from 'services/auth-services';
import { toast } from 'react-toastify';
import getFriendlyErrorMessage from 'utils/get-friendly-error-message';
import LoadingSpinerBtn from '../loading/loading-spiner-btn';
import { useTranslations } from 'next-intl';

export default function SignUpForm({
  setRenderSignUpForm,
}: {
  setRenderSignUpForm: React.Dispatch<SetStateAction<boolean>>;
}) {
  const t = useTranslations('auth.signup');
  const tLogin = useTranslations('auth.login');
  const tErr = useTranslations('errors');
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<signUpValidationSchemaType>({ resolver: zodResolver(signUpValidationSchema) });
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const onSubmit: SubmitHandler<signUpValidationSchemaType> = async (data) => {
    setIsLoading(true);
    try {
      const res = await AuthServices.signUp(data);

      if (!res.ok) {
        const dataError = await res.json();
        throw new Error(dataError.code || tLogin('failedToast'));
      }

      toast.success(t('successToast'));
      reset();
      setRenderSignUpForm(false);
    } catch (error: any) {
      toast.error(tErr(getFriendlyErrorMessage(error.message)));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <h2 className="text-center text-white text-lg font-semibold mb-6">{t('title')}</h2>
      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)}>
        {/* Name Input */}
        <div className="mb-2">
          <label htmlFor="name" className="block text-gray-300 mb-1">
            {t('username')}
          </label>
          <input
            type="text"
            id="name"
            className={`w-full p-2 border ${errors.name ? 'border-red-500' : 'border-slate-600'}
                       bg-black text-white focus:outline-none focus:ring-2
                       ${errors.name ? 'focus:ring-red-500' : 'focus:ring-[#e20913]'} rounded`}
            {...register('name')}
          />
          {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>}
        </div>
        {/* Email Input */}
        <div className="mb-2">
          <label htmlFor="email" className="block text-gray-300 mb-1">
            {t('email')}
          </label>
          <input
            type="email"
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
            {t('password')}
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
            disabled={isLoading}
          >
            {isLoading ? <LoadingSpinerBtn /> : t('submit')}
          </button>
        </div>
      </form>
      <div className="text-center mt-6">
        {t('haveAccount')}{' '}
        <span
          className="underline text-[#e20913] font-bold cursor-pointer"
          onClick={() => setRenderSignUpForm(false)}
        >
          {t('loginLink')}
        </span>
      </div>
    </>
  );
}

import { signUpValidationSchemaType } from 'schemas/signup-validation-schema';

const AuthServices = {

  signUp: async (data: signUpValidationSchemaType) => {
    const res = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    return res;
  },

  setAuthCookie: async (data: any) => {
    const res = await fetch('/api/auth/set-auth-cookie', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    return res;
  },

  removeAuthCookie: async () => {
    const res = await fetch('/api/auth/remove-auth-cookie');
    return res;
  },
};

export default AuthServices;

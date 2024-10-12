import { LoginValidationSchemaType } from 'schemas/login-validation-schema';
import { signUpValidationSchemaType } from 'schemas/signup-validation-schema';

const AuthServices = {
  login: async (data: LoginValidationSchemaType) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    return res;
  },

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

  logout: async() => {
    const res = await fetch('/api/auth/logout');
    return res;
  }
};

export default AuthServices;

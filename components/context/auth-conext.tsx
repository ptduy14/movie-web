'use client';

import { createContext, useContext, useEffect } from 'react';
import { LoginValidationSchemaType } from 'schemas/login-validation-schema';
import { signInWithEmailAndPassword, onAuthStateChanged } from 'firebase/auth';
import { auth } from '../../configs/firebase';
import getFriendlyErrorMessage from 'utils/get-friendly-error-message';
import { useDispatch, useSelector } from 'react-redux';
import { setUser } from '../../redux/slices/user-slice';
import { toast } from 'react-toastify';
import { db } from '../../configs/firebase';
import { doc, getDoc } from 'firebase/firestore';
import AuthServices from 'services/auth-services';

const AuthContext = createContext<undefined | AuthContextValueType>(undefined);

interface AuthContextValueType {
  login: (data: LoginValidationSchemaType) => Promise<boolean>;
}

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const dispatch = useDispatch();

  const login = async (data: LoginValidationSchemaType) => {
    try {
      await signInWithEmailAndPassword(auth, data.email, data.password);
      const user = auth.currentUser;

      // get more info form firestore
      const docRef = doc(db, 'Users', user!.uid);
      const docSnap = await getDoc(docRef);
      const userData = docSnap.data();

      const tokens = await user!.getIdTokenResult();
      const expirationTime = tokens.expirationTime;

      const userAccountInfo = {
        id: user!.uid,
        ...userData,
        accessToken: tokens.token,
        refreshToken: user!.refreshToken,
      };

      await AuthServices.setAuthCookie({ ...userAccountInfo, expirationTime });
      dispatch(setUser(userAccountInfo));

      return true;
    } catch (error: any) {
      toast.error(getFriendlyErrorMessage(error.code));
      return false;
    }
  };

  const AuthContextValue: AuthContextValueType = {
    login,
  };

  return <AuthContext.Provider value={AuthContextValue}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

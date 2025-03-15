'use client';

import { createContext, useContext } from 'react';
import { LoginValidationSchemaType } from 'schemas/login-validation-schema';
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth } from '../../lib/firebase';
import getFriendlyErrorMessage from 'utils/get-friendly-error-message';
import { useDispatch } from 'react-redux';
import { setUser } from '../../redux/slices/user-slice';
import { toast } from 'react-toastify';
import { db } from '../../lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import AuthServices from 'services/auth-services';

const AuthContext = createContext<undefined | AuthContextValueType>(undefined);

interface AuthContextValueType {
  login: (data: LoginValidationSchemaType) => Promise<boolean>;
  loginWithGoogle: () => Promise<boolean>;
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

      const userAccountInfo = {
        id: user!.uid,
        ...userData,
        accessToken: tokens.token,
        refreshToken: user!.refreshToken,
      };

      await AuthServices.setAuthCookie({ ...userAccountInfo });
      dispatch(setUser(userAccountInfo));

      return true;
    } catch (error: any) {
      toast.error(getFriendlyErrorMessage(error.code));
      return false;
    }
  };

  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
    const user = auth.currentUser;
    
    const docRef = doc(db, 'Users', user!.uid);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      await setDoc(docRef, {
        email: user?.email,
        name: user?.displayName,
        photo: user?.photoURL
      });
    }

    const tokens = await user!.getIdTokenResult();

    const userAccountInfo = {
      id: user!.uid,
      email: user?.email,
      name: user?.displayName,
      accessToken: tokens.token,
      refreshToken: user!.refreshToken,
      photo: user?.photoURL
    };

    await AuthServices.setAuthCookie({ ...userAccountInfo });
    dispatch(setUser(userAccountInfo));

    return true;
  }

  const AuthContextValue: AuthContextValueType = {
    login,
    loginWithGoogle
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

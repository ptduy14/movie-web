'use client';
import AuthModal from '@/components/auth/auth-modal';
import Layout from '@/components/layout';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import AuthModalProvider from '@/components/context/auth-modal-context';
import { Provider } from 'react-redux';
import { store } from '../redux/store';
import { PersistGate } from 'redux-persist/integration/react';
import persistStore from 'redux-persist/es/persistStore';
import AuthProvider from '@/components/context/auth-conext';

const persistor = persistStore(store);

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <PersistGate persistor={persistor}></PersistGate>
      <AuthProvider>
        <AuthModalProvider>
          <AuthModal />
          <Layout>{children}</Layout>
          <ToastContainer />
        </AuthModalProvider>
      </AuthProvider>
    </Provider>
  );
}

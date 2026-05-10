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
import HomePageLoadingProvider from '@/components/context/home-page-loading-context';
import { DropdownProvider } from '@/components/context/dropdown-context';
import DisclaimerModalProvider from '@/components/context/disclaimer-modal-context';
import DisclaimerModal from '@/components/disclaimer/disclaimer-modal';
import useCollectionFetcher from 'hooks/useCollectionFetcher';

const persistor = persistStore(store);

/**
 * Mounts side-effect hooks that need to run inside the Redux Provider tree.
 * Currently: bootstraps the user's movie collection from Firestore once per
 * login session (see `useCollectionFetcher`).
 */
function GlobalEffects() {
  useCollectionFetcher();
  return null;
}

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <PersistGate persistor={persistor}></PersistGate>
      <AuthProvider>
        <AuthModalProvider>
          <DisclaimerModalProvider>
            <HomePageLoadingProvider>
              <GlobalEffects />
              <AuthModal />
              <DisclaimerModal />
              <DropdownProvider>
                <Layout>{children}</Layout>
              </DropdownProvider>
              <ToastContainer />
            </HomePageLoadingProvider>
          </DisclaimerModalProvider>
        </AuthModalProvider>
      </AuthProvider>
    </Provider>
  );
}

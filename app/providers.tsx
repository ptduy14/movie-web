'use client';
import AuthModal from '@/components/auth/auth-modal';
import Layout from '@/components/layout';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import AuthModalProvider from '@/components/context/auth-modal-context';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthModalProvider>
      <AuthModal />
      <Layout>{children}</Layout>
      <ToastContainer />
    </AuthModalProvider>
  );
}

import { createContext, useContext, useState } from 'react';

const AuthModalContext = createContext<AuthModalContextValueType | undefined>(undefined);

interface AuthModalContextValueType {
  isAuthModalOpen: boolean;
  openAuthModal: () => void;
  closeAuthModal: () => void;
}

export default function AuthModalProvider({ children }: { children: React.ReactNode }) {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);

  const openAuthModal = () => {
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
  };

  const AuthModalContextValue: AuthModalContextValueType = {
    isAuthModalOpen,
    openAuthModal,
    closeAuthModal,
  };

  return (
    <AuthModalContext.Provider value={AuthModalContextValue}>{children}</AuthModalContext.Provider>
  );
}

export const useAuthModel = (): AuthModalContextValueType => {
  const context = useContext(AuthModalContext);
  if (!context) {
    throw new Error('useAuthModel must be used within an AuthModalProvider');
  }
  return context;
};

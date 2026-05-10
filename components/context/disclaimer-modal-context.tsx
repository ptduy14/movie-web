'use client';
import { createContext, useContext, useEffect, useState } from 'react';

const DISCLAIMER_STORAGE_KEY = 'moviex_disclaimer_accepted';

interface DisclaimerModalContextValueType {
  isDisclaimerOpen: boolean;
  acceptDisclaimer: () => void;
}

const DisclaimerModalContext = createContext<DisclaimerModalContextValueType | undefined>(
  undefined
);

export default function DisclaimerModalProvider({ children }: { children: React.ReactNode }) {
  const [isDisclaimerOpen, setIsDisclaimerOpen] = useState<boolean>(false);

  useEffect(() => {
    const isEnabled = process.env.NEXT_PUBLIC_DISCLAIMER_MODAL_ENABLED === 'true';
    if (!isEnabled) return;

    try {
      const accepted = window.localStorage.getItem(DISCLAIMER_STORAGE_KEY);
      if (!accepted) setIsDisclaimerOpen(true);
    } catch {
      // localStorage unavailable (private mode, SSR edge cases) — fail open and show the modal.
      setIsDisclaimerOpen(true);
    }
  }, []);

  const acceptDisclaimer = () => {
    try {
      window.localStorage.setItem(DISCLAIMER_STORAGE_KEY, '1');
    } catch {
      // ignore — user will see the modal again next visit
    }
    setIsDisclaimerOpen(false);
  };

  return (
    <DisclaimerModalContext.Provider value={{ isDisclaimerOpen, acceptDisclaimer }}>
      {children}
    </DisclaimerModalContext.Provider>
  );
}

export const useDisclaimerModal = (): DisclaimerModalContextValueType => {
  const context = useContext(DisclaimerModalContext);
  if (!context) {
    throw new Error('useDisclaimerModal must be used within a DisclaimerModalProvider');
  }
  return context;
};

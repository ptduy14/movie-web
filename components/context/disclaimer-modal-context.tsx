'use client';
import { createContext, useContext, useState } from 'react';
import {
  DISCLAIMER_COOKIE_MAX_AGE,
  DISCLAIMER_COOKIE_NAME,
} from '../disclaimer/disclaimer-constants';

interface DisclaimerModalContextValueType {
  isDisclaimerOpen: boolean;
  acceptDisclaimer: () => void;
}

const DisclaimerModalContext = createContext<DisclaimerModalContextValueType | undefined>(
  undefined
);

export default function DisclaimerModalProvider({
  children,
  initialAccepted,
}: {
  children: React.ReactNode;
  initialAccepted: boolean;
}) {
  const [isDisclaimerOpen, setIsDisclaimerOpen] = useState<boolean>(!initialAccepted);

  const acceptDisclaimer = () => {
    if (typeof document !== 'undefined') {
      const secure = window.location.protocol === 'https:' ? '; Secure' : '';
      document.cookie = `${DISCLAIMER_COOKIE_NAME}=1; path=/; max-age=${DISCLAIMER_COOKIE_MAX_AGE}; SameSite=Lax${secure}`;
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

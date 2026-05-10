'use client';
import { useEffect, useState } from 'react';
import { useDisclaimerModal } from '../context/disclaimer-modal-context';
import { DISCLAIMER_EXIT_DURATION_MS } from './disclaimer-constants';
import DisclaimerModal from './disclaimer-modal';

export default function DisclaimerGuard({ children }: { children: React.ReactNode }) {
  const { isDisclaimerOpen } = useDisclaimerModal();
  const [renderModal, setRenderModal] = useState<boolean>(isDisclaimerOpen);

  useEffect(() => {
    if (isDisclaimerOpen) {
      setRenderModal(true);
      return;
    }
    if (!renderModal) return;
    const t = setTimeout(() => setRenderModal(false), DISCLAIMER_EXIT_DURATION_MS);
    return () => clearTimeout(t);
  }, [isDisclaimerOpen, renderModal]);

  return (
    <>
      {!isDisclaimerOpen && children}
      {renderModal && <DisclaimerModal />}
    </>
  );
}

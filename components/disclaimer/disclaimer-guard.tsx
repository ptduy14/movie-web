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

  // Children (the app + homepage) always render, even while the disclaimer is
  // open — the modal is a fixed full-screen overlay that covers them and locks
  // body scroll. Keeping them mounted lets the homepage fetch/hydrate during
  // the brand intro and the disclaimer, so the page is ready by the time the
  // overlay(s) lift. (Previously children were unmounted until accept, so a
  // first-time user's homepage didn't even start loading until they clicked.)
  return (
    <>
      {children}
      {renderModal && <DisclaimerModal />}
    </>
  );
}

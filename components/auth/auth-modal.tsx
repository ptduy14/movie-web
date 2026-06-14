'use client';
import { useEffect, useRef, useState } from 'react';
import Logo from '../../public/mini-logo.png';
import Image from 'next/image';
import { IoClose } from 'react-icons/io5';
import { useAuthModel } from '../context/auth-modal-context';
import LoginForm from './login-form';
import SignUpForm from './signup-form';

export default function AuthModal() {
  const { isAuthModalOpen, closeAuthModal } = useAuthModel();
  const [showAnimation, setShowAnimation] = useState<boolean>(false);
  const [renderSignUpForm, setRenderSignUpForm] = useState<boolean>(false);
  const dialogRef = useRef<HTMLDivElement>(null);

  // Lock body scroll while open.
  useEffect(() => {
    if (isAuthModalOpen) {
      document.body.style.overflow = 'hidden';
      setShowAnimation(true);
    } else {
      document.body.style.overflow = 'unset';
      setShowAnimation(false);
      setRenderSignUpForm(false);
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isAuthModalOpen]);

  // a11y: focus the dialog on open, Escape to close, and trap Tab within it.
  useEffect(() => {
    if (!isAuthModalOpen) return;
    const dialog = dialogRef.current;
    const focusables = () =>
      Array.from(
        dialog?.querySelectorAll<HTMLElement>(
          'a[href],button:not([disabled]),input:not([disabled]),select,textarea,[tabindex]:not([tabindex="-1"])'
        ) ?? []
      );

    focusables()[0]?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeAuthModal();
        return;
      }
      if (e.key === 'Tab') {
        const els = focusables();
        if (els.length === 0) return;
        const first = els[0];
        const last = els[els.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isAuthModalOpen, closeAuthModal]);

  const renderForm = () => {
    if (renderSignUpForm) {
      return <SignUpForm setRenderSignUpForm={setRenderSignUpForm} />;
    }
    return <LoginForm setRenderSignUpForm={setRenderSignUpForm} />;
  };

  if (!isAuthModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:px-4">
      <div onClick={() => closeAuthModal()} className="absolute inset-0 bg-gray-900/60"></div>

      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label="Authentication"
        className={`relative w-full max-w-md max-h-[90vh] overflow-y-auto border border-slate-600 bg-black p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] rounded-t-2xl transition-all duration-300 ease-out sm:rounded-lg sm:pb-6 ${
          showAnimation
            ? 'translate-y-0 opacity-100 sm:scale-100'
            : 'translate-y-full opacity-0 sm:translate-y-0 sm:scale-95'
        }`}
      >
        {/* Close */}
        <button
          type="button"
          onClick={() => closeAuthModal()}
          aria-label="Close"
          className="absolute right-2 top-2 flex h-10 w-10 items-center justify-center rounded-full text-gray-300 transition-colors hover:bg-white/10 hover:text-white"
        >
          <IoClose size={22} />
        </button>

        {/* Logo */}
        <div className="mb-4 flex justify-center">
          <Image src={Logo} alt="Logo" className="h-16 w-16" />
        </div>

        {renderForm()}
      </div>
    </div>
  );
}

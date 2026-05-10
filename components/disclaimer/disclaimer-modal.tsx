'use client';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import Logo from '../../public/mini-logo.png';
import { useDisclaimerModal } from '../context/disclaimer-modal-context';

export default function DisclaimerModal() {
  const t = useTranslations('disclaimer');
  const { isDisclaimerOpen, acceptDisclaimer } = useDisclaimerModal();
  const [showAnimation, setShowAnimation] = useState<boolean>(false);

  useEffect(() => {
    if (isDisclaimerOpen) {
      document.body.style.overflow = 'hidden';
      document.body.style.paddingRight = `8px`;
      setShowAnimation(true);
    } else {
      document.body.style.overflow = 'unset';
      document.body.style.paddingRight = `0px`;
      setShowAnimation(false);
    }
    return () => {
      document.body.style.overflow = 'unset';
      document.body.style.paddingRight = `0px`;
    };
  }, [isDisclaimerOpen]);

  if (!isDisclaimerOpen) return null;

  const points = [
    t('points.purpose'),
    t('points.thirdParty'),
    t('points.noHosting'),
    t('points.contact'),
  ];

  return (
    <div
      className="fixed inset-0 flex justify-center items-center z-50 px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="disclaimer-modal-title"
    >
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />

      <div
        className={`relative w-full max-w-md transition-all duration-300 ease-out ${
          showAnimation ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
        }`}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute -inset-x-16 -top-16 h-44 bg-[#e20913]/10 blur-3xl"
        />

        <div className="relative bg-gradient-to-b from-zinc-900 to-black border border-white/10 rounded-2xl px-7 pt-7 pb-6 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.6)]">
          <div className="flex justify-center mb-4">
            <Image src={Logo} alt="MovieX" className="w-11 h-11 opacity-90" />
          </div>

          <h2
            id="disclaimer-modal-title"
            className="text-center text-white text-xl font-semibold tracking-tight mb-2"
          >
            {t('title')}
          </h2>

          <p className="text-gray-400 text-[13px] text-center leading-relaxed mb-6 max-w-sm mx-auto">
            {t('intro')}
          </p>

          <ul className="space-y-2.5 mb-7">
            {points.map((point, index) => (
              <li
                key={index}
                className="flex items-start gap-3 text-gray-300 text-[13px] leading-relaxed"
              >
                <span
                  aria-hidden
                  className="mt-[7px] w-1 h-1 rounded-full bg-gray-500 shrink-0"
                />
                <span>{point}</span>
              </li>
            ))}
          </ul>

          <div className="space-y-1">
            <button
              type="button"
              onClick={acceptDisclaimer}
              className="w-full bg-white text-black rounded-lg py-2.5 text-sm font-medium hover:bg-gray-100 transition-colors"
            >
              {t('agree')}
            </button>
            <a
              href="mailto:support@moviex.com?subject=Copyright%20concern"
              className="block w-full text-center text-gray-500 hover:text-gray-300 text-[13px] py-2 transition-colors"
            >
              {t('learnMore')}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

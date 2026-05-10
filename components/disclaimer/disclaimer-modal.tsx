'use client';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { FiBookOpen, FiGlobe, FiServer, FiMail } from 'react-icons/fi';
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
      // next paint → animate in
      const id = requestAnimationFrame(() => setShowAnimation(true));
      return () => cancelAnimationFrame(id);
    }
    document.body.style.overflow = 'unset';
    document.body.style.paddingRight = `0px`;
    setShowAnimation(false);
    return () => {
      document.body.style.overflow = 'unset';
      document.body.style.paddingRight = `0px`;
    };
  }, [isDisclaimerOpen]);

  if (!isDisclaimerOpen) return null;

  const features = [
    { Icon: FiBookOpen, label: t('points.purpose') },
    { Icon: FiGlobe, label: t('points.thirdParty') },
    { Icon: FiServer, label: t('points.noHosting') },
    { Icon: FiMail, label: t('points.contact') },
  ];

  return (
    <div
      className="fixed inset-0 flex justify-center items-center z-50 px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="disclaimer-modal-title"
    >
      <div
        aria-hidden
        className={`absolute inset-0 bg-black/85 backdrop-blur-xl transition-opacity duration-500 ${
          showAnimation ? 'opacity-100' : 'opacity-0'
        }`}
      />

      <div
        className={`relative w-full max-w-md transition-all duration-500 ease-out ${
          showAnimation
            ? 'opacity-100 scale-100 translate-y-0'
            : 'opacity-0 scale-95 translate-y-2'
        }`}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 w-72 h-72 rounded-full bg-[#E50914]/25 blur-[80px]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-20 -right-12 w-56 h-56 rounded-full bg-[#E50914]/10 blur-[80px]"
        />

        <div className="relative overflow-hidden rounded-[28px] bg-white/[0.04] backdrop-blur-2xl border border-white/10 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.7)]">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent"
          />

          <div className="relative px-8 pt-8 pb-7">
            <div className="flex justify-center mb-6">
              <div className="relative">
                <div
                  aria-hidden
                  className="absolute inset-0 -m-3 bg-[#E50914]/30 blur-2xl rounded-full"
                />
                <Image src={Logo} alt="MovieX" className="relative w-10 h-10" />
              </div>
            </div>

            <p className="text-center text-[10px] font-medium tracking-[0.22em] uppercase text-[#E50914]/80 mb-3">
              {t('eyebrow')}
            </p>

            <h2
              id="disclaimer-modal-title"
              className="text-center text-white text-2xl font-semibold tracking-tight mb-3"
            >
              {t('title')}
            </h2>

            <p className="text-center text-gray-400 text-sm leading-relaxed mb-7 max-w-sm mx-auto">
              {t('intro')}
            </p>

            <ul className="space-y-3 mb-8">
              {features.map(({ Icon, label }, index) => (
                <li
                  key={index}
                  className="flex items-center gap-3.5 text-gray-200 text-[13px] leading-relaxed"
                >
                  <span className="flex-shrink-0 flex items-center justify-center w-9 h-9 rounded-full bg-white/[0.06] border border-white/10">
                    <Icon className="w-3.5 h-3.5 text-gray-300" />
                  </span>
                  <span>{label}</span>
                </li>
              ))}
            </ul>

            <button
              type="button"
              onClick={acceptDisclaimer}
              className="w-full rounded-full bg-white text-black py-3.5 text-sm font-medium tracking-tight transition-all duration-300 hover:bg-gray-100 hover:shadow-[0_10px_30px_-10px_rgba(255,255,255,0.3)] active:scale-[0.98]"
            >
              {t('agree')}
            </button>

            <a
              href="mailto:support@moviex.com?subject=Copyright%20concern"
              className="block w-full text-center text-gray-500 hover:text-gray-300 text-xs tracking-wide py-3 mt-1 transition-colors"
            >
              {t('learnMore')}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

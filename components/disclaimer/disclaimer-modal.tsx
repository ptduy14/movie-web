'use client';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { FiBookOpen, FiGlobe, FiServer, FiMail } from 'react-icons/fi';
import Logo from '../../public/mini-logo.png';
import PosterCollection from '../../public/movie-poster-collection.png';
import { useDisclaimerModal } from '../context/disclaimer-modal-context';

export default function DisclaimerModal() {
  const t = useTranslations('disclaimer');
  const { isDisclaimerOpen, acceptDisclaimer } = useDisclaimerModal();
  const [showAnimation, setShowAnimation] = useState<boolean>(false);

  useEffect(() => {
    if (!isDisclaimerOpen) {
      setShowAnimation(false);
      return;
    }
    document.body.style.overflow = 'hidden';
    document.body.style.paddingRight = '8px';
    const id = requestAnimationFrame(() => setShowAnimation(true));
    return () => {
      cancelAnimationFrame(id);
      document.body.style.overflow = 'unset';
      document.body.style.paddingRight = '0px';
    };
  }, [isDisclaimerOpen]);

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
        className={`absolute inset-0 transition-opacity duration-500 ${
          showAnimation ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <Image
          src={PosterCollection}
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-black/40" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/60" />
      </div>

      <div
        className={`relative w-full max-w-md transition-all duration-500 ease-out ${
          showAnimation ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-2'
        }`}
      >
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-[#141414] to-[#0a0a0a] border border-white/[0.06] shadow-[0_30px_80px_-20px_rgba(0,0,0,0.9)]">
          <div className="relative px-9 pt-10 pb-8">
            <div className="flex justify-center mb-7">
              <Image src={Logo} alt="MovieX" className="w-11 h-11" />
            </div>

            <p className="text-center text-[10px] font-medium tracking-[0.32em] uppercase text-white/40 mb-4">
              {t('eyebrow')}
            </p>

            <h2
              id="disclaimer-modal-title"
              className="text-center text-white text-[26px] font-semibold tracking-tight mb-3"
            >
              {t('title')}
            </h2>

            <p className="text-center text-white/55 text-[13.5px] leading-relaxed mb-8 max-w-sm mx-auto">
              {t('intro')}
            </p>

            <ul className="space-y-4 mb-9">
              {features.map(({ Icon, label }, index) => (
                <li
                  key={index}
                  className="flex items-center gap-4 text-white/85 text-[13px] leading-relaxed"
                >
                  <span className="flex-shrink-0 flex items-center justify-center w-9 h-9 rounded-full bg-white/[0.05]">
                    <Icon className="w-[15px] h-[15px] text-white/75" />
                  </span>
                  <span>{label}</span>
                </li>
              ))}
            </ul>

            <button
              type="button"
              onClick={acceptDisclaimer}
              className="w-full rounded-xl bg-white text-black py-3.5 text-[13.5px] font-semibold tracking-tight transition-all duration-300 hover:bg-white/90 active:scale-[0.99]"
            >
              {t('agree')}
            </button>

            <a
              href="mailto:support@moviex.com?subject=Copyright%20concern"
              className="block w-full text-center text-white/40 hover:text-white/80 text-xs tracking-wide py-3 mt-1.5 transition-colors"
            >
              {t('learnMore')}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

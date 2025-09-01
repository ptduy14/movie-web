'use client';
import { useState, useEffect, useRef } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Keyboard } from 'swiper/modules';
import Image from 'next/image';
import { GrNext, GrPrevious } from 'react-icons/gr';
import { IoClose } from 'react-icons/io5';
import MovieImage from 'types/movie-image';
import 'swiper/css';
import 'swiper/css/navigation';

interface MovieImagesOverlayProps {
  images: MovieImage[];
  initialIndex: number;
  isOpen: boolean;
  onClose: () => void;
}

export const MovieImagesOverlay = ({
  images,
  initialIndex,
  isOpen,
  onClose,
}: MovieImagesOverlayProps) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const swiperRef = useRef<any>(null);

  useEffect(() => {
    setCurrentIndex(initialIndex);
  }, [initialIndex]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen || !images || images.length === 0) {
    return null;
  }

  const handleSlideChange = (swiper: any) => {
    setCurrentIndex(swiper.activeIndex);
  };

  const handlePrevSlide = () => {
    if (swiperRef.current) {
      swiperRef.current.slidePrev();
    }
  };

  const handleNextSlide = () => {
    if (swiperRef.current) {
      swiperRef.current.slideNext();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black bg-opacity-90" />

      {/* Close Button */}
      <button
        onClick={onClose}
        className="absolute top-4 left-4 z-10 p-2 bg-black bg-opacity-50 rounded-full text-white hover:bg-opacity-70 transition-all duration-200"
        aria-label="Close overlay"
      >
        <IoClose size={24} />
      </button>

      {/* Image Counter */}
      <div className="absolute top-4 right-4 z-10 px-3 py-1 bg-black bg-opacity-50 rounded-full text-white text-sm">
        {currentIndex + 1} / {images.length}
      </div>

      {/* Main Content */}
      <div className="relative w-full h-full flex items-center justify-center px-4">
        <div className="relative w-full h-full max-w-6xl max-h-[85vh]">
          <Swiper
            modules={[Navigation, Keyboard]}
            spaceBetween={0}
            slidesPerView={1}
            initialSlide={initialIndex}
            onSwiper={(swiper) => {
              swiperRef.current = swiper;
            }}
            onSlideChange={handleSlideChange}
            keyboard={{
              enabled: true,
            }}
            className="w-full h-full"
          >
            {images.map((image, index) => (
              <SwiperSlide key={index} className="flex items-center justify-center">
                <div className="relative w-full h-full flex items-center justify-center">
                  <div className="relative w-full h-full max-w-5xl max-h-[80vh]">
                    <Image
                      src={`${process.env.NEXT_PUBLIC_TMDB_IMG_DOMAIN}/t/p/original${image.file_path}`}
                      alt={`Movie Image ${index + 1}`}
                      fill
                      className="object-contain"
                      sizes="100vw"
                      priority={index === initialIndex}
                    />
                  </div>
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>

        {/* Navigation Arrows */}
        {images.length > 1 && (
          <>
            <button
              onClick={handlePrevSlide}
              className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10 p-3 bg-black bg-opacity-50 rounded-full text-white hover:bg-opacity-70 transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed"
              disabled={currentIndex === 0}
              aria-label="Previous image"
            >
              <GrPrevious size={24} />
            </button>

            <button
              onClick={handleNextSlide}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 z-10 p-3 bg-black bg-opacity-50 rounded-full text-white hover:bg-opacity-70 transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed"
              disabled={currentIndex === images.length - 1}
              aria-label="Next image"
            >
              <GrNext size={24} />
            </button>
          </>
        )}
      </div>
    </div>
  );
};

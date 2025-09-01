'use client';
import { Swiper, SwiperSlide } from 'swiper/react';
import MovieImageItem from './movie-image-item';
import { MovieImagesOverlay } from './movie-images-overlay';
import MovieImage from 'types/movie-image';
import { GrPrevious, GrNext } from 'react-icons/gr';
import { useRef, useState } from 'react';
import LoadingSpinner from '../loading/loading-spinner';

export default function MovieImageList({ images }: { images: MovieImage[] }) {
  const [isReachBegin, setIsReachBegin] = useState(false);
  const [isReachEnd, setIsReachEnd] = useState(false);
  const [isImagesReadyToDisplay, setIsImagesReadyToDisplay] = useState(false);
  const [isOverlayOpen, setIsOverlayOpen] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const swiperRef = useRef<any>(null);

  const handlePrevSlide = () => {
    swiperRef.current.slidePrev();
  };

  const handleNextSlide = () => {
    swiperRef.current.slideNext();
  };

  const handleImageClick = (index: number) => {
    setSelectedImageIndex(index);
    setIsOverlayOpen(true);
  };

  const handleCloseOverlay = () => {
    setIsOverlayOpen(false);
  };

  const renderImageItems = () => {
    if (!isImagesReadyToDisplay) {
      return <LoadingSpinner />;
    }

    if (images && images.length > 0) {
      return images.map((image, index) => (
        <SwiperSlide key={index}>
          <MovieImageItem image={image} onClick={() => handleImageClick(index)} />
        </SwiperSlide>
      ));
    }

    return <div>Đang cập nhật</div>;
  };

  // Don't render if no images
  if (!images || images.length === 0) {
    return null;
  }

  return (
    <>
      <div className="space-y-6">
        <div className="font-bold flex justify-between align-middle">
          <div>HÌNH ẢNH</div>
          <div className="flex gap-x-2">
            <div
              onClick={handlePrevSlide}
              className={`${isReachBegin ? 'opacity-30' : 'cursor-pointer'}`}
            >
              <GrPrevious size={18} />
            </div>
            <div
              onClick={handleNextSlide}
              className={`${isReachEnd ? 'opacity-30' : 'cursor-pointer'}`}
            >
              <GrNext size={18} />
            </div>
          </div>
        </div>
        <Swiper
          spaceBetween={30}
          slidesPerView={3}
          onSwiper={(swiper) => {
            swiperRef.current = swiper;
            setIsImagesReadyToDisplay(true);
          }}
          onProgress={(swiper, progress) => {
            progress === 0 ? setIsReachBegin(true) : setIsReachBegin(false);
            progress === 1 ? setIsReachEnd(true) : setIsReachEnd(false);
          }}
        >
          {renderImageItems()}
        </Swiper>
      </div>

      {/* Image Overlay */}
      <MovieImagesOverlay
        images={images}
        initialIndex={selectedImageIndex}
        isOpen={isOverlayOpen}
        onClose={handleCloseOverlay}
      />
    </>
  );
}

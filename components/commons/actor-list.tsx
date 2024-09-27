'use client';
import { Swiper, SwiperSlide } from 'swiper/react';
import ActorItem from './actor-item';
import DetailMovie from 'types/detail-movie';
import Credit from 'types/credit';
import { GrPrevious, GrNext } from 'react-icons/gr';
import { useEffect, useRef, useState } from 'react';
import isNonEmpty from 'utils/is-none-empty';
import creditIsvalid from 'utils/credit-is-valid';

export default function ActorList({
  movie,
  credit,
}: {
  movie: DetailMovie;
  credit: Credit | undefined;
}) {
  const [isReachBegin, setIsReachBegin] = useState(false);
  const [isReachEnd, setIsReachEnd] = useState(false);
  const swiperRef = useRef<any>(null);

  const handlePrevSlide = () => {
    swiperRef.current.slidePrev();
  };

  const handleNextSlide = () => {
    swiperRef.current.slideNext();
  };

  useEffect(() => {}, []);

  return (
    <div className="space-y-6">
      <div className="font-bold flex justify-between align-middle">
        <div>DIỄN VIÊN</div>
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
        slidesPerView={5}
        onSwiper={(swiper) => (swiperRef.current = swiper)}
        onProgress={(swiper, progess) => {
          progess === 0 ? setIsReachBegin(true) : setIsReachBegin(false);
          progess === 1 ? setIsReachEnd(true) : setIsReachEnd(false);
        }}
      >
        {creditIsvalid(credit) ? (
          credit!.cast.map((item) => (
            <SwiperSlide key={item.id}>
              <ActorItem actor={item} />
            </SwiperSlide>
          ))
        ) : isNonEmpty(movie.movie.actor) ? (
          movie.movie.actor.map((item, index) => (
            <SwiperSlide key={index}>
              <ActorItem actor={item} />
            </SwiperSlide>
          ))
        ) : (
          <div>Đang cập nhật</div>
        )}
      </Swiper>
    </div>
  );
}

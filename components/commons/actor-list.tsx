'use client';
import { Swiper, SwiperSlide } from 'swiper/react';
import ActorItem from './actor-item';
import DetailMovie from 'types/detail-movie';
import Credit from 'types/credit';
import { GrPrevious, GrNext } from 'react-icons/gr';
import { useRef, useState } from 'react';

export default function ActorList({
  movie,
  credit,
}: {
  movie: DetailMovie;
  credit: Credit | null;
}) {
    // const [isEndSlide, setIsEndSlide] = useState(false);
  const swiperRef = useRef<any>(null);

  const handlePrevSlide = () => {
    swiperRef.current.slidePrev();
  };

  const handleNextSlide = () => {
    swiperRef.current.slideNext();
  };
  return (
    <div className="space-y-6">
      <div className="font-bold flex justify-between align-middle">
        <div>DIỄN VIÊN</div>
        <div className='flex gap-x-2'>
          <div>
            <GrPrevious size={18} className="cursor-pointer" onClick={handlePrevSlide} />
          </div>
          <div>
            <GrNext size={18} className="cursor-pointer" onClick={handleNextSlide} />
          </div>
        </div>
      </div>
      <Swiper
        spaceBetween={30}
        slidesPerView={5}
        onSwiper={(swiper) => (swiperRef.current = swiper)}
        onReachBeginning={()=>{}}
      >
        {credit
          ? credit.cast.map((item) => (
              <SwiperSlide>
                <ActorItem key={item.id} actor={item} />
              </SwiperSlide>
            ))
          : movie.movie.actor &&
            movie.movie.actor.map((item, index) => (
              <SwiperSlide>
                <ActorItem key={index} actor={item} />
              </SwiperSlide>
            ))}
      </Swiper>
    </div>
  );
}

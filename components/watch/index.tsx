'use client';
import DetailMovie from 'types/detail-movie';
import VideoPlayer from './video-player';

export default function MovieWatchPage({ movie }: { movie: DetailMovie }) {
  console.log(movie.episodes[0].server_data[0].link_embed);
  return (
    <div className="pt-[3.75rem]">
        <VideoPlayer videoUrl={movie.episodes[0].server_data[0].link_m3u8} thumbnail={movie.movie.thumb_url}/>
    </div>
  );
}

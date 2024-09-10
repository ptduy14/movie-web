'use client';
import DetailMovie from 'types/detail-movie';
import VideoPlayer from './video-player';
import { useState } from 'react';
import isHaveEpisodesMovie from 'utils/isHaveEpisodesMovie';

export default function MovieWatchPage({ movie }: { movie: DetailMovie }) {
  const [episodeIndex, setEpisodeIndex] = useState<number>(0);
  const [episodeLink, setEpisodeLink] = useState<string>(
    movie.episodes[0].server_data[0].link_m3u8
  );

  const handleSwitchEpisode = (index: number) => {
    setEpisodeIndex(index);
    setEpisodeLink(movie.episodes[0].server_data[index].link_m3u8);
  };

  return (
    <div className="pt-[3.75rem] space-y-10">
      <VideoPlayer videoUrl={episodeLink} thumbnail={movie.movie.thumb_url} />
      <div className="container-wrapper-movie">
        <h1 className="text-3xl">{movie.movie.name}</h1>
        <h3 className="text-lg text-[#bbb6ae] mt-2">{movie.movie.origin_name}</h3>
      </div>
      {isHaveEpisodesMovie(movie) && (
        <div className="container-wrapper-movie">
          <h1 className="text-xl">Danh sách tập phim</h1>
          <ul className="flex flex-wrap gap-3 mt-4">
            {movie.episodes[0].server_data.map((ep, index) => (
              <li
                key={index}
                className={`block ${
                  episodeIndex === index ? 'text-white bg-[#5E5E5E]' : 'bg-white text-black hover:bg-[#d3d3d3]'
                } px-3 py-2 rounded-md font-semibold cursor-pointer`}
                onClick={() => handleSwitchEpisode(index)}
              >
                {ep.name}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

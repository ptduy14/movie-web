import React, { useRef, useEffect } from 'react';
import Hls from 'hls.js';
import { FaPlay } from "react-icons/fa";

const VideoPlayer = ({ videoUrl, thumbnail }: { videoUrl: string; thumbnail: string }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const overlay = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      if (Hls.isSupported()) {
        const hls = new Hls();
        hls.loadSource(videoUrl);
        hls.attachMedia(video);
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        // For Safari and other browsers that support HLS natively
        video.src = videoUrl;
      }
    }
    return () => {
      if (video && video.src) {
        video.pause();
        video.removeAttribute('src'); // Stop the video stream
        video.load();
      }
    };
  }, [videoUrl]);

  const handlePlayVideo = () => {
    videoRef.current?.play();
    overlay.current?.classList.add('hidden');
  }

  return (
    <div className="relative w-full h-[34rem]">
      <video ref={videoRef} controls style={{ width: '100%', height: '100%' }} />
      <div ref={overlay} className="absolute inset-0 bg-black flex items-center justify-center">
        <img src={thumbnail} alt="" className="h-full object-center object-cover" />
        <FaPlay className='absolute cursor-pointer z-10' size={40} onClick={handlePlayVideo}/>
        <div className='bg-red-600 absolute inset-0 opacity-5'></div>
      </div>
    </div>
  );
};

export default VideoPlayer;

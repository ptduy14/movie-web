import React, { useRef, useEffect, forwardRef } from 'react';
import Hls from 'hls.js';
import { FaPlay } from 'react-icons/fa';

type VideoPlayerProps = {
  videoUrl: string;
  thumbnail: string;
  videoProgress: number | null;
};

const VideoPlayer = forwardRef<HTMLVideoElement, VideoPlayerProps>(
  ({ videoUrl, thumbnail, videoProgress }, videoRef) => {
    const overlay = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
      if (!videoUrl) return; 

      const video = videoRef && 'current' in videoRef ? videoRef.current : null;
      
      if (video) {
        if (Hls.isSupported()) {
          const hls = new Hls();
          hls.loadSource(videoUrl);
          hls.attachMedia(video);
        } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
          // For Safari and other browsers that support HLS natively
          video.src = videoUrl;
        }
        
        if (videoProgress) {
          video.currentTime = videoProgress
          video.addEventListener('canplaythrough', () => handleAutoPlay(video))
        };
      }

      console.log(videoUrl)

      return () => {
        if (video && video.src) {
          video.pause();
          video.removeAttribute('src'); // Stop the video stream
          video.load();
        }

        if (videoProgress && video && video.src) {
          video.removeEventListener('canplaythrough', () => handleAutoPlay(video));
        }

        overlay.current?.classList.remove('hidden');
      };
    }, [videoUrl, videoProgress]);

    const handleAutoPlay = (video: any) => {
        video.play();
        overlay.current?.classList.add('hidden');
    }

    const handlePlayVideo = () => {
      if (videoRef && 'current' in videoRef) videoRef.current?.play();
      overlay.current?.classList.add('hidden');
    };

    return (
      <div className="relative w-full h-[34rem]">
        <video ref={videoRef} controls style={{ width: '100%', height: '100%' }} />
        <div ref={overlay} className="absolute inset-0 bg-black flex items-center justify-center">
          <img src={thumbnail} alt="" className="h-full object-center object-cover" />
          <FaPlay
            className="absolute cursor-pointer z-10 hover:scale-125 transition-all duration-200"
            size={40}
            onClick={handlePlayVideo}
          />
          <div className="bg-red-600 absolute inset-0 opacity-5"></div>
        </div>
      </div>
    );
  });

// Set a display name for the component
VideoPlayer.displayName = 'VideoPlayer';

export default VideoPlayer;

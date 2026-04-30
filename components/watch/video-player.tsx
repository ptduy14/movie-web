import React, { useRef, useEffect, forwardRef, useState, useCallback } from 'react';
import Hls from 'hls.js';
import { FaPlay } from 'react-icons/fa';
import LoadingSpinnerVideoPlayer from '../loading/loading-spiner-video-player';

type VideoPlayerProps = {
  videoUrl: string;
  thumbnail: string;
  videoProgress: number | null;
};

const VideoPlayer = forwardRef<HTMLVideoElement, VideoPlayerProps>(
  ({ videoUrl, thumbnail, videoProgress }, videoRef) => {
    const overlay = useRef<HTMLDivElement | null>(null);
    const [isCanPlay, setIsCanPlay] = useState<boolean>(false);

    const getVideo = useCallback(() => {
      return videoRef && 'current' in videoRef ? videoRef.current : null;
    }, [videoRef]);

    // Initialize HLS — reruns only when videoUrl changes (not tied to videoProgress)
    useEffect(() => {
      if (!videoUrl) return;
      const video = getVideo();
      if (!video) return;

      setIsCanPlay(false);
      overlay.current?.classList.remove('hidden');

      let hls: Hls | null = null;
      if (Hls.isSupported()) {
        hls = new Hls();
        hls.loadSource(videoUrl);
        hls.attachMedia(video);
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = videoUrl;
      }

      return () => {
        hls?.destroy();
        if (video.src || hls) {
          video.pause();
          video.removeAttribute('src');
          video.load();
        }
        overlay.current?.classList.remove('hidden');
      };
    }, [videoUrl, getVideo]);

    // Seek + autoplay when videoProgress is set (user accepts resume)
    // Split effect to avoid HLS re-init like the previous bug
    useEffect(() => {
      if (!videoProgress || videoProgress <= 0) return;
      const video = getVideo();
      if (!video) return;

      const applyProgress = () => {
        video.currentTime = videoProgress;
        video.play().catch(() => {});
        overlay.current?.classList.add('hidden');
      };

      // If video is ready → apply now; otherwise wait for canplay
      if (video.readyState >= 2) {
        applyProgress();
      } else {
        video.addEventListener('canplay', applyProgress, { once: true });
        return () => video.removeEventListener('canplay', applyProgress);
      }
    }, [videoProgress, getVideo]);

    const handleCanPlayThrough = useCallback(() => {
      setIsCanPlay(true);
    }, []);

    const handlePlayVideo = () => {
      const video = getVideo();
      video?.play();
      overlay.current?.classList.add('hidden');
    };

    useEffect(() => {
      const video = getVideo();
      if (!video) return;

      video.addEventListener('canplaythrough', handleCanPlayThrough);
      return () => video.removeEventListener('canplaythrough', handleCanPlayThrough);
    }, [handleCanPlayThrough, getVideo]);

    return (
      <div className="relative w-full h-[34rem]">
        <video ref={videoRef} controls style={{ width: '100%', height: '100%' }} />
        <div ref={overlay} className="absolute inset-0 bg-black flex items-center justify-center">
          <img src={thumbnail} alt="" className="h-full object-center object-cover" />
          {isCanPlay ? (
            <FaPlay
              className="absolute cursor-pointer z-10 hover:scale-125 transition-all duration-200"
              size={40}
              onClick={handlePlayVideo}
            />
          ) : (
            <LoadingSpinnerVideoPlayer />
          )}
          <div className="bg-red-600 absolute inset-0 opacity-5"></div>
        </div>
      </div>
    );
  }
);

// Set a display name for the component
VideoPlayer.displayName = 'VideoPlayer';

export default VideoPlayer;

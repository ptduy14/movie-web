import React, { useRef, useEffect, forwardRef, useState, useCallback } from 'react';
import Hls from 'hls.js';
import { FaPlay } from 'react-icons/fa';
import LoadingSpinnerVideoPlayer from '../loading/loading-spiner-video-player';
import VideoControlsOverlay from './video-controls';
import type {
  NextEpisodePreview,
  PlayerMeta,
  PlayerServer,
} from './video-controls/player-context';

type VideoPlayerProps = {
  videoUrl: string;
  thumbnail: string;
  videoProgress: number | null;
  meta: PlayerMeta;

  // Phase 2 — passes through to VideoControlsOverlay
  servers: PlayerServer[];
  currentServerIndex: number;
  onSwitchLanguage: (newServerIndex: number) => void;
  nextEpisode: NextEpisodePreview | null;
  onNextEpisode: () => void;
};

const VideoPlayer = forwardRef<HTMLVideoElement, VideoPlayerProps>(
  (
    {
      videoUrl,
      thumbnail,
      videoProgress,
      meta,
      servers,
      currentServerIndex,
      onSwitchLanguage,
      nextEpisode,
      onNextEpisode,
    },
    videoRef
  ) => {
    const overlay = useRef<HTMLDivElement | null>(null);
    const containerRef = useRef<HTMLDivElement | null>(null);
    const [isCanPlay, setIsCanPlay] = useState<boolean>(false);
    // Becomes true on first user interaction with the pre-play poster. Until
    // then, the custom controls overlay stays disabled so the poster + FaPlay
    // CTA owns the surface (matches the previous UX).
    const [hasStarted, setHasStarted] = useState<boolean>(false);

    const getVideo = useCallback(() => {
      return videoRef && 'current' in videoRef ? videoRef.current : null;
    }, [videoRef]);

    // Initialize HLS — reruns only when videoUrl changes (not tied to videoProgress)
    useEffect(() => {
      if (!videoUrl) return;
      const video = getVideo();
      if (!video) return;

      setIsCanPlay(false);
      // Only reset hasStarted when there's no pending resume. A language
      // switch sets `videoProgress` to the previous currentTime to preserve
      // playback context — in that case we want to skip the poster.
      if (!videoProgress) setHasStarted(false);
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
      // videoProgress is intentionally not a dep — checked once at setup.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [videoUrl, getVideo]);

    // Seek + autoplay when videoProgress is set (user accepts resume or
    // language switch). Split effect to avoid HLS re-init.
    useEffect(() => {
      if (!videoProgress || videoProgress <= 0) return;
      const video = getVideo();
      if (!video) return;

      const applyProgress = () => {
        video.currentTime = videoProgress;
        video.play().catch(() => {});
        overlay.current?.classList.add('hidden');
        setHasStarted(true);
      };

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
      setHasStarted(true);
    };

    useEffect(() => {
      const video = getVideo();
      if (!video) return;

      video.addEventListener('canplaythrough', handleCanPlayThrough);
      return () => video.removeEventListener('canplaythrough', handleCanPlayThrough);
    }, [handleCanPlayThrough, getVideo]);

    return (
      <div ref={containerRef} className="relative w-full aspect-video bg-black">
        <video
          ref={videoRef}
          playsInline
          className="absolute inset-0 h-full w-full"
        />

        <VideoControlsOverlay
          videoRef={videoRef as React.RefObject<HTMLVideoElement | null>}
          containerRef={containerRef}
          meta={meta}
          servers={servers}
          currentServerIndex={currentServerIndex}
          onSwitchLanguage={onSwitchLanguage}
          nextEpisode={nextEpisode}
          onNextEpisode={onNextEpisode}
          disabled={!hasStarted}
        />

        {/* Pre-play poster + spinner. Sits above the controls overlay (z-20)
            until the user clicks Play. Then it hides via classList. */}
        <div
          ref={overlay}
          className="absolute inset-0 z-20 flex items-center justify-center bg-black"
        >
          <img src={thumbnail} alt="" className="h-full w-full object-cover object-center" />
          {isCanPlay ? (
            <FaPlay
              className="absolute z-10 cursor-pointer text-ink-primary transition-all duration-200 hover:scale-125"
              size={40}
              onClick={handlePlayVideo}
            />
          ) : (
            <LoadingSpinnerVideoPlayer />
          )}
          <div className="absolute inset-0 bg-red-600 opacity-5"></div>
        </div>
      </div>
    );
  }
);

// Set a display name for the component
VideoPlayer.displayName = 'VideoPlayer';

export default VideoPlayer;

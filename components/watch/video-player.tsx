import React, { useRef, useEffect, forwardRef, useState, useCallback } from 'react';
import Hls from 'hls.js';
import { FaPlay } from 'react-icons/fa';
import LoadingSpinnerVideoPlayer from '../loading/loading-spiner-video-player';
import VideoControlsOverlay from './video-controls';
import ProgresswatchNotification from './progress-watch-notification';
import { isTouchDevice, requestVideoFullscreen } from 'utils/mobile-fullscreen';
import { createAdFilteringPlaylistLoader } from 'lib/hls-ad-filter';
import type {
  NextEpisodePreview,
  PlayerMeta,
  PlayerServer,
} from './video-controls/player-context';

/** Resume-prompt data, surfaced as a top-center card inside the player. */
export type ResumePrompt = {
  show: boolean;
  position: number;
  episodeIndex: number;
  isMultiEpisode: boolean;
  onAccept: () => void;
  onReject: () => void;
};

type VideoPlayerProps = {
  videoUrl: string;
  thumbnail: string;
  videoProgress: number | null;
  meta: PlayerMeta;
  resume: ResumePrompt;

  // Phase 2 — passes through to VideoControlsOverlay
  servers: PlayerServer[];
  currentServerIndex: number;
  onSwitchLanguage: (newServerIndex: number) => void;
  nextEpisode: NextEpisodePreview | null;
  onNextEpisode: () => void;
  /**
   * The stream could not be loaded (manifest/network error, or the native
   * player gave up). The watch page decides what to do: retry, another
   * server, or the fallback source.
   */
  onFatalError?: (detail: string) => void;
};

/**
 * One loader class for the app's lifetime. hls.js instantiates it per
 * request, so a module-level class costs nothing and keeps the config
 * object stable across re-inits.
 */
const AdFilteringPlaylistLoader = createAdFilteringPlaylistLoader();

const VideoPlayer = forwardRef<HTMLVideoElement, VideoPlayerProps>(
  (
    {
      videoUrl,
      thumbnail,
      videoProgress,
      meta,
      resume,
      servers,
      currentServerIndex,
      onSwitchLanguage,
      nextEpisode,
      onNextEpisode,
      onFatalError,
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
    const onFatalErrorRef = useRef(onFatalError);
    onFatalErrorRef.current = onFatalError;

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
      const onNativeError = () => onFatalErrorRef.current?.('native media error');
      if (Hls.isSupported()) {
        // The catalog splices a video ad into its playlists; the custom playlist
        // loader cuts it out before hls.js parses them (lib/hls-ad-filter).
        hls = new Hls({ pLoader: AdFilteringPlaylistLoader });
        hls.on(Hls.Events.ERROR, (_event, data) => {
          if (!data.fatal) return;
          if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
            // Decoder hiccups are usually recoverable in place.
            hls?.recoverMediaError();
            return;
          }
          onFatalErrorRef.current?.(`${data.type}:${data.details}`);
        });
        hls.loadSource(videoUrl);
        hls.attachMedia(video);
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        // Native HLS (older iOS). The ad filter can't reach this path.
        video.src = videoUrl;
        video.addEventListener('error', onNativeError);
      }

      return () => {
        video.removeEventListener('error', onNativeError);
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
      // Mobile: tapping Play enters fullscreen-landscape (this runs inside the
      // tap gesture, so the fullscreen request is allowed). Orientation lock is
      // handled centrally on `fullscreenchange` in usePlayerState.
      if (isTouchDevice()) requestVideoFullscreen(containerRef.current, video);
    };

    useEffect(() => {
      const video = getVideo();
      if (!video) return;

      video.addEventListener('canplaythrough', handleCanPlayThrough);
      return () => video.removeEventListener('canplaythrough', handleCanPlayThrough);
    }, [handleCanPlayThrough, getVideo]);

    return (
      // `isolate` creates a new stacking context so the overlay's internal
      // z-indexes (controls z-10, poster z-20, next-ep z-20, resume prompt
      // z-30, settings z-30, help z-40, lock z-40) stay scoped to the player.
      // The resume prompt sits at z-30 so it stays visible above the pre-play
      // poster (z-20) during the poster phase.
      <div ref={containerRef} className="relative isolate w-full aspect-video bg-black">
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

        {/* Resume prompt — top-center, above the poster. Stays inside the
            player surface instead of floating over the page. */}
        <ProgresswatchNotification
          show={resume.show}
          position={resume.position}
          episodeIndex={resume.episodeIndex}
          isMultiEpisode={resume.isMultiEpisode}
          onAccept={resume.onAccept}
          onReject={resume.onReject}
        />
      </div>
    );
  }
);

// Set a display name for the component
VideoPlayer.displayName = 'VideoPlayer';

export default VideoPlayer;

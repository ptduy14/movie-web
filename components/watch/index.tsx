'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import DetailMovie from 'types/detail-movie';
import VideoPlayer from './video-player';
import VidsrcPlayer from './vidsrc-player';
import StreamNotice from './stream-notice';
import { isHaveEpisodesMovie } from 'utils/movie-utils';
import { useVideoProgress } from 'hooks/useVideoProgress';
import { useWatchAnalytics } from 'hooks/useWatchAnalytics';
import { useVidsrcBridge } from 'hooks/useVidsrcBridge';
import { useVideoElementBridge } from 'hooks/useVideoElementBridge';
import { useStreamReachability } from 'hooks/useStreamReachability';
import { analytics } from 'lib/posthog/events';
import { subtitleLanguagesFor } from 'services/vidsrc-service';
import { localizedLang } from 'constants/i18n-mappings';
import { tmdbBackdropLoader, tmdbBackdropSrcSet } from 'lib/tmdb-image';
import type { Locale } from 'i18n/routing';
import type { PlaybackSnapshot, VidsrcEvent, VidsrcStatus } from 'hooks/useVidsrcBridge';
import type { NextEpisodePreview, PlayerServer } from './video-controls/player-context';
import CommentSection from '../comment';

/**
 * The watch page.
 *
 * Two playback surfaces, one at a time:
 *
 *  - **main** — the in-house hls.js player on the episode's catalog m3u8. It
 *    has the Vietsub / Thuyết Minh / Lồng Tiếng servers, our own controls,
 *    and the spliced-in ad cut out of the playlist.
 *  - **backup** — the vidsrc iframe, addressed by TMDB id. Subtitles only,
 *    but it plays from anywhere.
 *
 * the catalog's video CDN only answers Vietnamese IPs, so before (and while)
 * the main player loads, `useStreamReachability` checks whether this browser
 * can actually reach it, and why not when it can't. Viewers abroad are moved
 * to the backup automatically; viewers on WARP or a VPN are told to switch it
 * off, with the backup one click away.
 *
 * `episodes[]` is the server list (one entry per audio track), so
 * `serverIndex` picks the audio. Seasons are separate titles upstream and are
 * linked from the detail page.
 */
export default function MovieWatchPage({ movie }: { movie: DetailMovie }) {
  const t = useTranslations('watch');
  const locale = useLocale() as Locale;

  const [serverIndex, setServerIndex] = useState<number>(0);
  const [episodeIndex, setEpisodeIndex] = useState<number>(0);
  const [episodeLink, setEpisodeLink] = useState<string>('');
  /** The viewer asked for the backup source. */
  const [preferBackup, setPreferBackup] = useState(false);
  /** The main player hit a fatal error on the current episode. */
  const [mainFailed, setMainFailed] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  const servers = useMemo(() => movie.episodes ?? [], [movie.episodes]);
  const isMultiEpisode = isHaveEpisodesMovie(movie);
  const episodes = servers[serverIndex]?.server_data ?? [];
  const current = episodes[episodeIndex];
  const m3u8 = current?.link_m3u8 ?? '';
  const embed = current?.link_embed ?? '';

  // ---- Which surface ------------------------------------------------------

  const reach = useStreamReachability(m3u8);
  const mainBlocked = Boolean(m3u8) && (reach.status === 'blocked' || mainFailed);
  const surface: 'main' | 'backup' | 'none' = !m3u8
    ? embed
      ? 'backup'
      : 'none'
    : embed && (preferBackup || (reach.status === 'blocked' && reach.reason === 'abroad'))
      ? 'backup'
      : 'main';
  // A fatal player error with the probe still green means the CDN or this
  // link, not the viewer's network.
  const blockReason = reach.status === 'blocked' ? reach.reason : mainFailed ? 'cdn' : null;

  const surfaceRef = useRef(surface);
  surfaceRef.current = surface;

  // ---- Playback bridges ---------------------------------------------------

  /**
   * Bridge callbacks reach forward to handlers declared further down; the
   * indirection lets the bridges be created first (progress needs their
   * snapshot as an input).
   */
  const handlersRef = useRef<{
    onEvent?: (event: VidsrcEvent) => void;
    onStatusChange?: (status: VidsrcStatus) => void;
  }>({});

  const iframeBridge = useVidsrcBridge({
    iframeRef,
    onEvent: (event) => {
      if (surfaceRef.current === 'backup') handlersRef.current.onEvent?.(event);
    },
    onStatusChange: (status) => {
      if (surfaceRef.current === 'backup') handlersRef.current.onStatusChange?.(status);
    },
  });
  const videoBridge = useVideoElementBridge({
    videoRef,
    enabled: surface === 'main' && !mainBlocked,
    onEvent: (event) => handlersRef.current.onEvent?.(event),
    onStatusChange: (status) => handlersRef.current.onStatusChange?.(status),
  });

  /** Whichever surface is on screen, as one stable ref for progress. */
  const iframePlayback = iframeBridge.playbackRef;
  const videoPlayback = videoBridge.playbackRef;
  const playbackRef = useMemo<React.RefObject<PlaybackSnapshot>>(
    () => ({
      get current() {
        return surfaceRef.current === 'backup' ? iframePlayback.current : videoPlayback.current;
      },
    }),
    [iframePlayback, videoPlayback]
  );

  const {
    restoredProgress,
    isShowResumePrompt,
    handleAcceptResume,
    handleRejectResume,
    setVideoProgress,
    videoProgress,
    handlePlaybackPaused,
  } = useVideoProgress({
    movie,
    playbackRef,
    episodeIndex,
    episodeLink,
    serverIndex,
    setEpisodeIndex,
    setEpisodeLink,
    setServerIndex,
  });

  const { trackEvent } = useWatchAnalytics({
    movieId: movie.movie._id,
    episodeIndex,
    serverIndex,
  });

  const linkOf = useCallback(
    (ep: { link_m3u8?: string; link_embed?: string } | undefined) =>
      ep?.link_m3u8 || ep?.link_embed || '',
    []
  );

  // Start on the first episode of the first server whenever the title changes.
  useEffect(() => {
    setServerIndex(0);
    setEpisodeIndex(0);
    setEpisodeLink(linkOf(servers[0]?.server_data?.[0]));
    setVideoProgress(null);
    setPreferBackup(false);
    setMainFailed(false);
    iframeBridge.reset();
    videoBridge.reset();
    // `servers` is derived from `movie`, so keying on the title id is enough.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [movie.movie._id]);

  // A new episode or server gets a fresh chance on the main player.
  useEffect(() => {
    setMainFailed(false);
  }, [m3u8]);

  /**
   * The iframe URL: the episode's backup address plus the two things only
   * known now — subtitle preference and a resume position. `link_embed`
   * itself stays free of `startAt`; progress records key on it.
   */
  const embedUrl = useMemo(() => {
    if (!embed) return '';
    try {
      const url = new URL(embed);
      if (videoProgress && videoProgress > 0) {
        url.searchParams.set('startAt', String(Math.floor(videoProgress)));
      }
      const dsLang = subtitleLanguagesFor(locale);
      if (dsLang.length) url.searchParams.set('ds_lang', dsLang.slice(0, 3).join(','));
      return url.toString();
    } catch {
      return embed;
    }
  }, [embed, videoProgress, locale]);

  // ---- Navigation ---------------------------------------------------------

  const switchEpisode = useCallback(
    (index: number, options: { silent?: boolean } = {}) => {
      const target = episodes[index];
      if (!target || index === episodeIndex) return;

      if (!options.silent) analytics.episodeSwitched(movie.movie._id, episodeIndex, index);
      setEpisodeIndex(index);
      setEpisodeLink(linkOf(target));
      setVideoProgress(null);
    },
    [episodes, episodeIndex, movie.movie._id, linkOf, setVideoProgress]
  );

  /**
   * Audio switch (Vietsub ↔ Thuyết Minh ↔ Lồng Tiếng). Keeps the episode and
   * — past the first few seconds — the playback position, so switching
   * language mid-scene lands on the same scene.
   */
  const switchServer = useCallback(
    (index: number) => {
      const server = servers[index];
      if (!server?.server_data?.length || index === serverIndex) return;

      const preservedTime = playbackRef.current?.currentTime ?? 0;
      const clampedEp = Math.min(episodeIndex, server.server_data.length - 1);

      analytics.serverSwitched(movie.movie._id, serverIndex, index);
      setServerIndex(index);
      setEpisodeIndex(clampedEp);
      setEpisodeLink(linkOf(server.server_data[clampedEp]));
      setVideoProgress(preservedTime > 3 ? preservedTime : null);
    },
    [servers, serverIndex, episodeIndex, movie.movie._id, linkOf, playbackRef, setVideoProgress]
  );

  const handleNextEpisode = useCallback(() => {
    if (episodeIndex + 1 < episodes.length) switchEpisode(episodeIndex + 1);
  }, [episodeIndex, episodes.length, switchEpisode]);

  /** Advance when an episode ends; stop at the last one. */
  const handleEpisodeCompleted = useCallback(() => {
    if (!isMultiEpisode) return;
    if (episodeIndex + 1 < episodes.length) switchEpisode(episodeIndex + 1, { silent: true });
  }, [isMultiEpisode, episodeIndex, episodes.length, switchEpisode]);

  // Assigned during render so the closures are current for any event that
  // lands before the next commit.
  handlersRef.current = {
    onEvent: (event) => {
      trackEvent(event);
      if (event.status === 'completed') handleEpisodeCompleted();
    },
    // Only a genuine pause force-syncs. Syncing on `completed` too would
    // save "at the very end of episode N" just before moving to N+1.
    onStatusChange: (status) => {
      if (status === 'paused') handlePlaybackPaused();
    },
  };

  const switchToBackup = useCallback(() => {
    // Carry the position over: the iframe resumes via `startAt`.
    const time = playbackRef.current?.currentTime ?? 0;
    if (time > 3) setVideoProgress(time);
    setPreferBackup(true);
  }, [playbackRef, setVideoProgress]);

  const switchToMain = useCallback(() => {
    setPreferBackup(false);
    setMainFailed(false);
    reach.retry();
  }, [reach]);

  const retryMain = useCallback(() => {
    setMainFailed(false);
    reach.retry();
  }, [reach]);

  // ---- Player props -------------------------------------------------------

  const playerServers: PlayerServer[] = useMemo(
    () =>
      servers.map((srv) => ({
        name: localizedLang(srv.server_name, locale),
        episodeCount: srv.server_data.length,
      })),
    [servers, locale]
  );

  // Pre-play poster: TMDB's backdrop when the title has one (sharp, from
  // TMDB's CDN); the catalog's landscape still — often 780px — otherwise.
  const backdrop = movie.movie.tmdb_backdrop;
  const posterSrc = backdrop
    ? tmdbBackdropLoader({ src: backdrop, width: 1920 })
    : movie.movie.poster_url;
  const posterSrcSet = backdrop ? tmdbBackdropSrcSet(backdrop) : undefined;
  const posterW780 = backdrop ? tmdbBackdropLoader({ src: backdrop, width: 780 }) : '';

  const nextEpisode: NextEpisodePreview | null = useMemo(() => {
    const nextIdx = episodeIndex + 1;
    if (nextIdx >= episodes.length) return null;
    return {
      index: nextIdx,
      label: isMultiEpisode ? t('episodeLabel', { index: nextIdx + 1 }) : episodes[nextIdx].name,
      thumbnail: posterW780 || movie.movie.poster_url || movie.movie.thumb_url,
    };
  }, [episodes, episodeIndex, isMultiEpisode, posterW780, movie.movie.poster_url, movie.movie.thumb_url, t]);

  const resume = {
    show: isShowResumePrompt,
    position: restoredProgress.position,
    episodeIndex: restoredProgress.episodeIndex,
    isMultiEpisode,
    onAccept: handleAcceptResume,
    onReject: handleRejectResume,
  };

  return (
    <div className="pt-20 lg:pt-[3.75rem] space-y-6 lg:space-y-10">
      {surface === 'main' && mainBlocked ? (
        <StreamNotice
          variant="blocked"
          reason={blockReason}
          isRetrying={reach.status === 'checking'}
          onRetry={retryMain}
          onUseFallback={embed ? switchToBackup : null}
        />
      ) : surface === 'main' ? (
        <VideoPlayer
          ref={videoRef}
          videoUrl={m3u8}
          thumbnail={posterSrc}
          thumbnailSrcSet={posterSrcSet}
          videoProgress={videoProgress}
          meta={{
            title: movie.movie.name,
            episodeLabel: isMultiEpisode ? t('episodeLabel', { index: episodeIndex + 1 }) : undefined,
          }}
          resume={resume}
          servers={playerServers}
          currentServerIndex={serverIndex}
          onSwitchLanguage={switchServer}
          nextEpisode={nextEpisode}
          onNextEpisode={handleNextEpisode}
          onFatalError={() => {
            setMainFailed(true);
            reach.retry();
          }}
        />
      ) : (
        <VidsrcPlayer
          ref={iframeRef}
          embedUrl={surface === 'backup' ? embedUrl : ''}
          title={movie.movie.name}
          unavailableLabel={t('unavailable')}
          resume={resume}
        />
      )}

      {surface === 'backup' && m3u8 && (
        <StreamNotice
          variant="fallback"
          reason={reach.reason}
          onRetry={retryMain}
          onUseFallback={null}
          onUseMain={switchToMain}
        />
      )}

      <div className="container-wrapper-movie px-4 lg:px-0">
        <h1 className="text-xl lg:text-3xl">{movie.movie.name}</h1>
        <h3 className="text-base lg:text-lg text-[#bbb6ae] mt-2">{movie.movie.origin_name}</h3>
      </div>

      {/* Audio servers (Vietsub / Thuyết Minh / Lồng Tiếng) — only when there is a choice. */}
      {servers.length > 1 && (
        <div className="container-wrapper-movie px-4 lg:px-0">
          <h2 className="text-lg lg:text-xl">{t('serverList')}</h2>
          <ul className="mt-4 flex flex-wrap gap-2 lg:gap-3">
            {servers.map((server, index) => (
              <li key={`${server.server_name}-${index}`}>
                <button
                  type="button"
                  onClick={() => switchServer(index)}
                  className={`flex min-h-[44px] items-center justify-center rounded-md px-3 text-sm font-semibold lg:min-h-0 lg:py-2 lg:text-base ${
                    serverIndex === index
                      ? 'bg-[#5E5E5E] text-white'
                      : 'bg-white text-black hover:bg-[#d3d3d3]'
                  }`}
                >
                  {localizedLang(server.server_name, locale)}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {isMultiEpisode && (
        <div className="container-wrapper-movie px-4 lg:px-0">
          <h2 className="text-lg lg:text-xl">{t('episodeList')}</h2>
          <ul className="mt-4 flex flex-wrap gap-2 lg:gap-3">
            {episodes.map((_ep, index) => (
              <li key={index}>
                <button
                  type="button"
                  onClick={() => switchEpisode(index)}
                  className={`flex min-h-[44px] min-w-[44px] items-center justify-center rounded-md px-3 text-sm font-semibold lg:min-h-0 lg:py-2 lg:text-base ${
                    episodeIndex === index
                      ? 'bg-[#5E5E5E] text-white'
                      : 'bg-white text-black hover:bg-[#d3d3d3]'
                  }`}
                >
                  {t('episodeLabel', { index: index + 1 })}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="container-wrapper-movie px-4 lg:px-0">
        <CommentSection movie={movie} />
      </div>
    </div>
  );
}

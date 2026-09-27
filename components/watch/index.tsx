'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import DetailMovie from 'types/detail-movie';
import VidsrcPlayer from './vidsrc-player';
import { isHaveEpisodesMovie } from 'utils/movie-utils';
import { useVideoProgress } from 'hooks/useVideoProgress';
import { useWatchAnalytics } from 'hooks/useWatchAnalytics';
import { useVidsrcBridge } from 'hooks/useVidsrcBridge';
import { analytics } from 'lib/posthog/events';
import { buildEmbedUrl, subtitleLanguagesFor } from 'services/vidsrc-service';
import type { VidsrcEvent, VidsrcStatus } from 'hooks/useVidsrcBridge';
import CommentSection from '../comment';
import type { MediaType } from 'constants/tmdb-taxonomy';

/**
 * The watch page.
 *
 * Playback is a third-party iframe, so this component owns everything AROUND
 * the player: which season and episode are selected, the resume prompt, watch
 * progress, analytics, and advancing to the next episode when one finishes.
 *
 * Season handling reuses the `episodes[]` structure: each entry is a season
 * (see `types/episode.ts`), so `serverIndex` is really a season index. The
 * name is kept because the progress records already persisted under it use
 * that field, and renaming it would orphan every stored position.
 */
export default function MovieWatchPage({ movie }: { movie: DetailMovie }) {
  const t = useTranslations('watch');
  const locale = useLocale();

  const [serverIndex, setServerIndex] = useState<number>(0);
  const [episodeIndex, setEpisodeIndex] = useState<number>(0);
  const [episodeLink, setEpisodeLink] = useState<string>('');

  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  // Memoized so the `??` doesn't hand every callback below a fresh array
  // identity on each render, which would rebuild them all every time.
  const seasons = useMemo(() => movie.episodes ?? [], [movie.episodes]);
  const isMultiEpisode = isHaveEpisodesMovie(movie);
  const mediaType = (movie.movie.tmdb?.type ?? 'movie') as MediaType;

  /**
   * Indirection so the bridge can be set up before the hooks that handle its
   * events. The bridge owns `playbackRef`, which `useVideoProgress` needs as
   * an input, so it has to be created first — and its callbacks then have to
   * reach forward to handlers declared below.
   */
  const handlersRef = useRef<{
    onEvent?: (event: VidsrcEvent) => void;
    onStatusChange?: (status: VidsrcStatus) => void;
  }>({});

  const { playbackRef, requestEpisode, reset } = useVidsrcBridge({
    iframeRef,
    onEvent: (event) => handlersRef.current.onEvent?.(event),
    onStatusChange: (status) => handlersRef.current.onStatusChange?.(status),
  });

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

  // Start on the first episode of the first season whenever the title changes.
  useEffect(() => {
    const first = seasons[0]?.server_data?.[0];
    setServerIndex(0);
    setEpisodeIndex(0);
    setEpisodeLink(first?.link_embed ?? '');
    setVideoProgress(null);
    reset();
    // `seasons` is derived from `movie`, so keying on the title id is enough.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [movie.movie._id]);

  /**
   * The URL actually handed to the iframe.
   *
   * Built here rather than reused from `link_embed` because two things are
   * only known at render time: the viewer's subtitle preference, and whether
   * this mount is a resume (which needs `startAt`). `link_embed` stays the
   * stable identity used by watch-progress records — it must NOT carry
   * `startAt`, or every saved position would key on a different string.
   */
  const embedUrl = useMemo(() => {
    const tmdbId = movie.movie.tmdb?.id;
    const imdbId = movie.movie.imdb?.id ?? null;
    if (!tmdbId && !imdbId) return '';

    return buildEmbedUrl({
      type: mediaType,
      tmdbId,
      imdbId,
      season: mediaType === 'tv' ? serverIndex + 1 : undefined,
      episode: mediaType === 'tv' ? episodeIndex + 1 : undefined,
      startAt: videoProgress ?? undefined,
      dsLang: subtitleLanguagesFor(locale),
    });
  }, [movie.movie.tmdb?.id, movie.movie.imdb?.id, mediaType, serverIndex, episodeIndex, videoProgress, locale]);

  const switchEpisode = useCallback(
    (index: number, options: { silent?: boolean } = {}) => {
      const list = seasons[serverIndex]?.server_data ?? [];
      const target = list[index];
      if (!target || index === episodeIndex) return;

      if (!options.silent) analytics.episodeSwitched(movie.movie._id, episodeIndex, index);
      setEpisodeIndex(index);
      setEpisodeLink(target.link_embed);
      setVideoProgress(null);

      // Try the in-player channel first so the frame doesn't reload. It is
      // undocumented, so a false return falls through to the iframe remount
      // that the `embedUrl` change triggers anyway.
      if (mediaType === 'tv') requestEpisode(serverIndex + 1, index + 1);
    },
    [seasons, serverIndex, episodeIndex, movie.movie._id, mediaType, requestEpisode, setVideoProgress]
  );

  const switchSeason = useCallback(
    (index: number) => {
      const season = seasons[index];
      if (!season?.server_data?.length || index === serverIndex) return;

      analytics.serverSwitched(movie.movie._id, serverIndex, index);
      setServerIndex(index);
      setEpisodeIndex(0);
      setEpisodeLink(season.server_data[0].link_embed);
      setVideoProgress(null);
    },
    [seasons, serverIndex, movie.movie._id, setVideoProgress]
  );

  /** Advance when an episode ends; stop at the end of a season. */
  const handleEpisodeCompleted = useCallback(() => {
    if (!isMultiEpisode) return;
    const list = seasons[serverIndex]?.server_data ?? [];
    const next = episodeIndex + 1;
    if (next >= list.length) return;
    switchEpisode(next, { silent: true });
  }, [isMultiEpisode, seasons, serverIndex, episodeIndex, switchEpisode]);

  // Wire the bridge to the handlers now that they exist. Assigning during
  // render (not in an effect) keeps the closures current for events that
  // arrive between this render and the next commit.
  handlersRef.current = {
    onEvent: (event) => {
      trackEvent(event);
      if (event.status === 'completed') handleEpisodeCompleted();
    },
    // Only a genuine pause force-syncs. Doing it on `completed` too would
    // persist "you are at the very end of episode N" a moment before moving
    // to N+1, so the next visit would offer to resume the episode just
    // finished.
    onStatusChange: (status) => {
      if (status === 'paused') handlePlaybackPaused();
    },
  };

  const episodes = seasons[serverIndex]?.server_data ?? [];

  return (
    <div className="pt-20 lg:pt-[3.75rem] space-y-6 lg:space-y-10">
      <VidsrcPlayer
        ref={iframeRef}
        embedUrl={embedUrl}
        title={movie.movie.name}
        unavailableLabel={t('unavailable')}
        resume={{
          show: isShowResumePrompt,
          position: restoredProgress.position,
          episodeIndex: restoredProgress.episodeIndex,
          isMultiEpisode,
          onAccept: handleAcceptResume,
          onReject: handleRejectResume,
        }}
      />

      <div className="container-wrapper-movie px-4 lg:px-0">
        <h1 className="text-xl lg:text-3xl">{movie.movie.name}</h1>
        <h3 className="text-base lg:text-lg text-[#bbb6ae] mt-2">{movie.movie.origin_name}</h3>
      </div>

      {/* Season picker — only meaningful for a series with more than one. */}
      {seasons.length > 1 && (
        <div className="container-wrapper-movie px-4 lg:px-0">
          <h2 className="text-lg lg:text-xl">{t('seasonList')}</h2>
          <ul className="mt-4 flex flex-wrap gap-2 lg:gap-3">
            {seasons.map((season, index) => (
              <li key={season.server_name}>
                <button
                  type="button"
                  onClick={() => switchSeason(index)}
                  className={`flex min-h-[44px] items-center justify-center rounded-md px-3 text-sm font-semibold lg:min-h-0 lg:py-2 lg:text-base ${
                    serverIndex === index
                      ? 'bg-[#5E5E5E] text-white'
                      : 'bg-white text-black hover:bg-[#d3d3d3]'
                  }`}
                >
                  {t('seasonLabel', { index: index + 1 })}
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

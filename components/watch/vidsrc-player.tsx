'use client';

import { forwardRef } from 'react';
import ProgresswatchNotification from './progress-watch-notification';

/** Resume-prompt data, surfaced as a top-center card over the player. */
export type ResumePrompt = {
  show: boolean;
  position: number;
  episodeIndex: number;
  isMultiEpisode: boolean;
  onAccept: () => void;
  onReject: () => void;
};

interface VidsrcPlayerProps {
  /** Full embed URL from `buildEmbedUrl`. Empty string renders the fallback. */
  embedUrl: string;
  title: string;
  resume: ResumePrompt;
  /** Message shown when the title has no playable embed URL. */
  unavailableLabel: string;
}

/**
 * Hardening switch for the iframe `sandbox` attribute.
 *
 * The provider actively blocks sandboxed embeds: a script on its embed page
 * redirects to a "stop caging the player" page when it detects either a
 * `sandbox` attribute on its own frame or an opaque origin. Reading that
 * script, a sandbox that INCLUDES `allow-same-origin` should slip past both
 * checks while still withholding `allow-popups` and `allow-top-navigation` —
 * which is exactly the pair that makes pop-unders and tab-hijacking possible.
 *
 * That is a hypothesis drawn from their code, not a verified result, so it
 * ships OFF. Once someone confirms the player still loads with the sandbox
 * applied (gate V1 in docs/vidsrc-migration-plan.md), set
 * `NEXT_PUBLIC_VIDSRC_SANDBOX=true` and the hardening turns on with no code
 * change. If the provider later tightens the check, unset it again.
 */
const SANDBOX_ENABLED = process.env.NEXT_PUBLIC_VIDSRC_SANDBOX === 'true';
const SANDBOX_TOKENS = 'allow-scripts allow-same-origin allow-forms allow-presentation';

/**
 * The player surface.
 *
 * This replaced an in-house hls.js player with custom controls. The provider
 * serves playback exclusively through its own embed — the stream sits behind
 * a short-lived, host-bound token — so the controls, the subtitle menu, the
 * quality picker and the fullscreen behaviour now all live inside the iframe
 * and are not ours to style or extend. What the app keeps is everything
 * around the frame: the resume prompt, watch progress, analytics, and the
 * season/episode list below.
 *
 * The ref is forwarded so the watch page can reach `contentWindow` for the
 * postMessage channel (`useVidsrcBridge`).
 */
const VidsrcPlayer = forwardRef<HTMLIFrameElement, VidsrcPlayerProps>(
  ({ embedUrl, title, resume, unavailableLabel }, ref) => {
    return (
      // `isolate` scopes the resume prompt's z-index to the player surface so
      // it can't bleed over the site header.
      <div className="relative isolate w-full aspect-video bg-black">
        {embedUrl ? (
          <iframe
            ref={ref}
            key={embedUrl}
            src={embedUrl}
            title={title}
            className="absolute inset-0 h-full w-full border-0"
            allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
            allowFullScreen
            referrerPolicy="origin"
            {...(SANDBOX_ENABLED ? { sandbox: SANDBOX_TOKENS } : {})}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center px-6 text-center text-sm text-[#bbb6ae]">
            {unavailableLabel}
          </div>
        )}

        {/* Resume prompt — top-center, above the frame. */}
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

VidsrcPlayer.displayName = 'VidsrcPlayer';

export default VidsrcPlayer;

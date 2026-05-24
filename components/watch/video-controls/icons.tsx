// Centralized SVG icons for the video controls overlay.
// Custom paths (instead of react-icons) give pixel-tight control over visual
// language — stroke widths, optical sizes, etc. — and keep the bundle smaller
// than importing a whole icon set.

import React from 'react';

type IconProps = React.SVGProps<SVGSVGElement> & { size?: number };

const base = (size: number) => ({
  width: size,
  height: size,
  viewBox: '0 0 24 24',
  fill: 'none',
  xmlns: 'http://www.w3.org/2000/svg',
});

export const PlayIcon = ({ size = 24, ...rest }: IconProps) => (
  <svg {...base(size)} {...rest}>
    <path d="M6 4.5v15l13-7.5L6 4.5z" fill="currentColor" />
  </svg>
);

export const PauseIcon = ({ size = 24, ...rest }: IconProps) => (
  <svg {...base(size)} {...rest}>
    <rect x="6" y="4.5" width="4" height="15" rx="1" fill="currentColor" />
    <rect x="14" y="4.5" width="4" height="15" rx="1" fill="currentColor" />
  </svg>
);

export const Skip10BackIcon = ({ size = 24, ...rest }: IconProps) => (
  <svg {...base(size)} {...rest}>
    <path
      d="M12 5V2L7 6l5 4V7a6 6 0 1 1-6 6"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <text x="12" y="16" textAnchor="middle" fontSize="7" fontWeight="700" fill="currentColor">
      10
    </text>
  </svg>
);

export const Skip10ForwardIcon = ({ size = 24, ...rest }: IconProps) => (
  <svg {...base(size)} {...rest}>
    <path
      d="M12 5V2l5 4-5 4V7a6 6 0 1 0 6 6"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <text x="12" y="16" textAnchor="middle" fontSize="7" fontWeight="700" fill="currentColor">
      10
    </text>
  </svg>
);

export const VolumeHighIcon = ({ size = 24, ...rest }: IconProps) => (
  <svg {...base(size)} {...rest}>
    <path
      d="M4 9v6h4l5 4V5L8 9H4z"
      fill="currentColor"
    />
    <path
      d="M16 8.5a4.5 4.5 0 0 1 0 7M18.5 6a8 8 0 0 1 0 12"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
    />
  </svg>
);

export const VolumeLowIcon = ({ size = 24, ...rest }: IconProps) => (
  <svg {...base(size)} {...rest}>
    <path d="M4 9v6h4l5 4V5L8 9H4z" fill="currentColor" />
    <path
      d="M16 8.5a4.5 4.5 0 0 1 0 7"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
    />
  </svg>
);

export const VolumeMutedIcon = ({ size = 24, ...rest }: IconProps) => (
  <svg {...base(size)} {...rest}>
    <path d="M4 9v6h4l5 4V5L8 9H4z" fill="currentColor" />
    <path
      d="M16 9l5 6M21 9l-5 6"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    />
  </svg>
);

export const FullscreenEnterIcon = ({ size = 24, ...rest }: IconProps) => (
  <svg {...base(size)} {...rest}>
    <path
      d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const FullscreenExitIcon = ({ size = 24, ...rest }: IconProps) => (
  <svg {...base(size)} {...rest}>
    <path
      d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

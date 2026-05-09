<div align="center">

# 🎬 MovieX

### A modern Next.js streaming platform with AI-powered translation, watch progress sync & personalized collections

[![Live Demo](https://img.shields.io/badge/Live_Demo-Visit_Site-000?style=for-the-badge&logo=vercel&logoColor=white)](https://movie-web-seven-beta.vercel.app/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](./LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-14-000?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Firebase](https://img.shields.io/badge/Firebase-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)](https://firebase.google.com/)

[![GitHub stars](https://img.shields.io/github/stars/ptduy14/movie-web?style=social)](https://github.com/ptduy14/movie-web/stargazers)
[![GitHub forks](https://img.shields.io/github/forks/ptduy14/movie-web?style=social)](https://github.com/ptduy14/movie-web/network/members)
[![GitHub last commit](https://img.shields.io/github/last-commit/ptduy14/movie-web)](https://github.com/ptduy14/movie-web/commits/main)
[![GitHub issues](https://img.shields.io/github/issues/ptduy14/movie-web)](https://github.com/ptduy14/movie-web/issues)

[**🌐 Live Demo**](https://movie-web-seven-beta.vercel.app/) · [**🐛 Report Bug**](https://github.com/ptduy14/movie-web/issues) · [**✨ Request Feature**](https://github.com/ptduy14/movie-web/issues)

</div>

---

<!-- HERO SCREENSHOT / DEMO GIF -->
<div align="center">

<!-- Replace the line below with your hero screenshot or demo GIF -->
<!-- Example: <img src="./public/screenshots/hero.png" alt="MovieX preview" width="100%" /> -->

<!-- > 📸 _Hero screenshot / demo GIF goes here_ -->

<img src="./public/screenshots/home-screenshot.png" alt="MovieX preview" width="100%" />

</div>

---

## 📑 Table of Contents

- [About The Project](#-about-the-project)
- [Key Features](#-key-features)
- [Tech Stack](#-tech-stack)
- [Screenshots](#-screenshots)
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Variables](#environment-variables)
  - [Running Locally](#running-locally)
- [Available Scripts](#-available-scripts)
- [Project Structure](#-project-structure)
- [Roadmap](#-roadmap)
- [Contributing](#-contributing)
- [License](#-license)
- [Acknowledgments](#-acknowledgments)
- [Contact](#-contact)

---

## 📖 About The Project

**MovieX** is a full-featured, production-ready movie streaming web app built with **Next.js 14 (App Router)**. It delivers a Netflix-style browsing experience with secure authentication, smooth HLS video playback, cross-device watch-progress sync, and an **AI-powered translation pipeline** that automatically localizes movie metadata into multiple languages.

### Why MovieX?

- ⚡ **Built on the modern Next.js App Router** — server components, streaming SSR, and locale-prefixed routes for SEO.
- 🤖 **AI-driven internationalization** — uses the **Groq LLM API** (Llama 3.3 70B) inside a Vercel Cron job to batch-translate movie content, so users in any locale see fully localized titles and descriptions without manual work.
- 📺 **Real HLS streaming** with adaptive bitrate via `hls.js`, episode selection, and per-server fallbacks.
- ☁️ **Firebase-backed user data** — auth, Firestore for collections/comments/notifications, and persistent watch-progress sync across devices.
- 🌍 **Truly multilingual UX** — locale-aware routing with `next-intl`, language switcher, and localized date/number formatting.

---

## ✨ Key Features

### 🎥 Streaming & Playback

- **HLS adaptive streaming** with custom-built video player
- **Episode navigation** for series with multiple seasons
- **Multi-server fallback** — switch between mirror sources when one fails
- **Resume where you left off** — watch progress is auto-saved and synced

### 🔐 Authentication & Profile

- **Email/password authentication** powered by Firebase Auth
- **Secure HTTP-only cookie sessions** verified server-side via Firebase Admin
- **Personal profile** with editable info, security settings, and language preferences

### 📚 Personalization

- **Favorites & Collections** — add movies to your personal library, persisted in Firestore
- **Watch history** — full timeline of recently watched content
- **Cross-device progress sync** — pick up on phone where you left off on desktop

### 🔎 Discovery

- **Full-text movie search** with debounced input and brand-safe placeholders
- **Browse by type, country, and format** with infinite scroll
- **Curated home page** — hero carousel, daily updates, recommendations
- **TMDB-powered metadata** including cast, crew, ratings, and trailers

### 🤖 AI-Powered Translation

- **Automated batch translation** of new movie metadata via **Groq + Llama 3.3 70B**
- Runs on a **Vercel Cron schedule** with `CRON_SECRET` authorization
- Fully localized UI through `next-intl` middleware

### 💬 Community

- **Threaded comments** with replies and like reactions
- **Real-time notifications** with desktop dropdown + mobile drawer

---

## 🛠 Tech Stack

| Layer                    | Technologies                                                                                                                                                                                      |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Framework**            | [Next.js 14](https://nextjs.org/) (App Router), [React 18](https://react.dev/), [TypeScript 5](https://www.typescriptlang.org/)                                                                   |
| **Styling**              | [Tailwind CSS 3](https://tailwindcss.com/), [Swiper](https://swiperjs.com/)                                                                                                                       |
| **State Management**     | [Redux Toolkit](https://redux-toolkit.js.org/), [redux-persist](https://github.com/rt2zz/redux-persist), React Context                                                                            |
| **Forms & Validation**   | [React Hook Form](https://react-hook-form.com/), [Zod](https://zod.dev/), [@hookform/resolvers](https://github.com/react-hook-form/resolvers)                                                     |
| **Backend & Data**       | [Firebase Auth](https://firebase.google.com/products/auth), [Cloud Firestore](https://firebase.google.com/products/firestore), [Firebase Admin SDK](https://firebase.google.com/docs/admin/setup) |
| **Video**                | [hls.js](https://github.com/video-dev/hls.js/) for adaptive HLS streaming                                                                                                                         |
| **AI / Translation**     | [Groq SDK](https://groq.com/) running [Llama 3.3 70B](https://ai.meta.com/llama/)                                                                                                                 |
| **Internationalization** | [next-intl](https://next-intl-docs.vercel.app/)                                                                                                                                                   |
| **External APIs**        | [TMDB API](https://developer.themoviedb.org/docs) for metadata                                                                                                                                    |
| **Deployment**           | [Vercel](https://vercel.com/) (Edge + Cron Jobs)                                                                                                                                                  |

---

## 📸 Screenshots

<!-- > _Add your screenshots here. Suggested layout:_ -->
<img src="./public/screenshots/search-screenshot.png" alt="MovieX preview" width="100%" />

<div align="center">

<!-- | Home page | Movie detail | -->
<!-- |---|---| -->
<!-- | ![Home](./public/screenshots/home.png) | ![Detail](./public/screenshots/detail.png) | -->

<!-- | Watch page | Profile | -->
<!-- |---|---| -->
<!-- | ![Watch](./public/screenshots/watch.png) | ![Profile](./public/screenshots/profile.png) | -->

</div>

---

## 🚀 Getting Started

Follow these steps to run MovieX locally.

### Prerequisites

- **Node.js** `>= 18.17` (LTS recommended)
- **npm** `>= 9` (or `pnpm` / `yarn`)
- A **Firebase** project with:
  - Email/password Auth enabled
  - Cloud Firestore enabled
  - A service account JSON (for Firebase Admin)
- A **TMDB** API access token — [get one here](https://developer.themoviedb.org/docs/getting-started)
- A **Groq** API key for AI translation — [get one here](https://console.groq.com/) _(optional, only if you enable the translation cron)_
- A movie content API endpoint (you supply your own video source)

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/ptduy14/movie-web.git

# 2. Move into the project folder
cd movie-web

# 3. Install dependencies
npm install
```

### Environment Variables

Create a `.env` file in the project root and fill in the following keys:

```bash
# ── Firebase (client) ─────────────────────────────────────────
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# ── Firebase Admin (server) ───────────────────────────────────
# base64-encoded service-account JSON
NEXT_PUBLIC_FIREBASE_CREDENTIALS_BASE64=your_base64_service_account

# ── TMDB ──────────────────────────────────────────────────────
NEXT_PUBLIC_TMDB_ACCESS_TOKEN=your_tmdb_v4_access_token
NEXT_PUBLIC_TMDB_IMG_DOMAIN=https://image.tmdb.org

# ── Movie content source (bring your own) ─────────────────────
NEXT_PUBLIC_API_DOMAIN=https://your-movie-api.example.com
NEXT_PUBLIC_IMG_DOMAIN=https://your-image-cdn.example.com/

# ── AI translation (optional, only if cron is enabled) ────────
GROQ_API_KEY=your_groq_api_key
GROQ_MODEL=llama-3.3-70b-versatile

# ── Cron security ─────────────────────────────────────────────
CRON_SECRET=any_random_long_string
```

> 💡 To generate the base64 service-account string, download your Firebase service-account JSON, then run:
>
> ```bash
> # Linux / macOS
> base64 -i path/to/service-account.json
> # Windows PowerShell
> [Convert]::ToBase64String([IO.File]::ReadAllBytes("path\to\service-account.json"))
> ```

### Running Locally

```bash
# Start the Next.js dev server (hot reload at http://localhost:3000)
npm run dev

# Production build
npm run build && npm run start
```

---

## 📜 Available Scripts

| Command         | Description                                  |
| --------------- | -------------------------------------------- |
| `npm run dev`   | Start the development server with hot reload |
| `npm run build` | Build the production bundle                  |
| `npm run start` | Start the production server                  |
| `npm run lint`  | Run ESLint over the codebase                 |

---

## 🗂 Project Structure

```
movie-web/
├── app/                      # Next.js App Router pages & API routes
│   ├── [locale]/             # Locale-prefixed routes (i18n)
│   │   ├── movies/           # Browse, watch, detail, search
│   │   ├── profile/          # User profile pages
│   │   └── ...
│   └── api/                  # Route handlers (auth, progress, cron)
├── components/               # Reusable UI components
│   ├── auth/                 # Login, signup, modals
│   ├── watch/                # Video player, server selector
│   ├── header/ · footer/ · home/ · profile/ ...
├── hooks/                    # Custom React hooks
├── lib/                      # Firebase client & admin SDK setup
├── redux/                    # Redux Toolkit store, slices, persistence
├── schemas/                  # Zod validation schemas
├── services/                 # API clients (auth, TMDB, etc.)
├── types/                    # Shared TypeScript types
├── utils/                    # Helper utilities
└── public/                   # Static assets
```

---

## 🗺 Roadmap

- [x] Authentication & user profiles
- [x] HLS video playback with episode selection
- [x] Watch progress sync across devices
- [x] AI-powered batch translation pipeline
- [x] Comments & notifications
- [ ] Social login (Google, GitHub)
- [ ] Subtitle support (multi-language)
- [ ] Offline / PWA support
- [ ] Recommendation engine

See the [open issues](https://github.com/ptduy14/movie-web/issues) for a full list of proposed features and known issues.

---

## 🤝 Contributing

Contributions make the open-source community an amazing place to learn and create. Any contributions you make are **greatly appreciated**.

1. **Fork** the project
2. Create your feature branch
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. Commit your changes
   ```bash
   git commit -m "feat: add some amazing feature"
   ```
4. Push to the branch
   ```bash
   git push origin feature/amazing-feature
   ```
5. Open a **Pull Request**

Please make sure your code passes `npm run lint` before submitting.

---

## 📄 License

Distributed under the **MIT License**. See [`LICENSE`](./LICENSE) for more information.

---

## 🙏 Acknowledgments

- [**The Movie Database (TMDB)**](https://www.themoviedb.org/) — this product uses the TMDB API but is not endorsed or certified by TMDB.

  <a href="https://www.themoviedb.org/"><img src="https://www.themoviedb.org/assets/2/v4/logos/v2/blue_short-8e7b30f73a4020692ccca9c88bafe5dcb6f8a62a4c6bc55cd9ba82bb2cd95f6c.svg" alt="TMDB" height="30" /></a>

- [**Next.js**](https://nextjs.org/), [**Vercel**](https://vercel.com/), [**Firebase**](https://firebase.google.com/), [**Groq**](https://groq.com/), [**Tailwind CSS**](https://tailwindcss.com/) and the broader open-source community.
- [**Shields.io**](https://shields.io/) for the badges.

---

## 📬 Contact

**ptduy14** — [GitHub Profile](https://github.com/ptduy14)

Project Link: [https://github.com/ptduy14/movie-web](https://github.com/ptduy14/movie-web)

Live Demo: [https://movie-web-seven-beta.vercel.app/](https://movie-web-seven-beta.vercel.app/)

---

<div align="center">

⭐ **If you find this project useful, please consider giving it a star!** ⭐

Made with ❤️ using Next.js, Firebase, and AI

</div>

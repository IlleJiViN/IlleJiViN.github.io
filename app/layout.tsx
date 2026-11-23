import type { Metadata } from "next";
import "./globals.css";
import MusicTheme from './MusicTheme';

export const metadata: Metadata = {
  title: "IlleJiViN — Blog",
  description: "프로젝트와 개발 기록, 일기와 음악 이야기.",
};

const readAppearancePreferences = `
  (() => {
    const root = document.documentElement;
    try {
      root.dataset.theme = localStorage.getItem('portfolio-theme') === 'light' ? 'light' : 'dark';
      root.dataset.musicMood = localStorage.getItem('blog-music-mood') === 'metal' ? 'metal' : 'jazz';
      root.dataset.scoreView = localStorage.getItem('blog-score-view') === 'clear' ? 'clear' : 'expressive';
    } catch {
      root.dataset.theme = 'dark';
      root.dataset.musicMood = 'jazz';
      root.dataset.scoreView = 'expressive';
    }
  })();
`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko" data-score-view="expressive" suppressHydrationWarning>
      <head><script dangerouslySetInnerHTML={{ __html: readAppearancePreferences }} /></head>
      <body><MusicTheme>{children}</MusicTheme></body>
    </html>
  );
}

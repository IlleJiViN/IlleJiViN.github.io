import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "IlleJiViN — AI & Software Portfolio",
  description: "AI 검색·영상 자동화·보안·강화학습 프로젝트와 진행 중인 연구를 정리한 IlleJiViN의 포트폴리오.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ko" suppressHydrationWarning><head><script dangerouslySetInnerHTML={{ __html: `(function(){try{var t=localStorage.getItem('portfolio-theme');document.documentElement.dataset.theme=t==='dark'||t==='light'?t:matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'}catch(e){document.documentElement.dataset.theme=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'}})();` }} /></head><body>{children}</body></html>;
}

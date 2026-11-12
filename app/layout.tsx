import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "IlleJiViN — Blog",
  description: "프로젝트와 개발 기록, 일기와 음악 이야기.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ko" suppressHydrationWarning><head><script dangerouslySetInnerHTML={{ __html: `(function(){try{var t=localStorage.getItem('portfolio-theme');document.documentElement.dataset.theme=t==='dark'||t==='light'?t:'dark'}catch(e){document.documentElement.dataset.theme='dark'}})();` }} /></head><body>{children}</body></html>;
}

import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "IlleJiViN — Developer Log",
  description: "게임, AI 검색, 자동화 도구와 보안 연구를 만드는 IlleJiViN의 개발 기록.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ko"><body>{children}</body></html>;
}

"use client";

import { useEffect, useState } from 'react';

export default function ThemeToggle() {
  const [dark, setDark] = useState(false);
  useEffect(() => { setDark(document.documentElement.dataset.theme === 'dark'); }, []);
  function toggle() {
    const next = !dark;
    document.documentElement.dataset.theme = next ? 'dark' : 'light';
    setDark(next);
    try { localStorage.setItem('portfolio-theme', next ? 'dark' : 'light'); } catch {}
  }
  return <button type="button" className="theme-toggle" onClick={toggle} aria-label={dark ? '라이트 모드로 전환' : '다크 모드로 전환'} aria-pressed={dark}>{dark ? '☀ 라이트' : '☾ 다크'}</button>;
}

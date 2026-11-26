"use client";

import { useEffect, useState, type ReactNode } from 'react';
import { Theme } from '@astryxdesign/core/theme';
import { jazzNotesTheme as jazzTheme } from './themes/jazz-notes';

export default function MusicTheme({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<'dark' | 'light'>('dark');
  useEffect(() => {
    const root = document.documentElement;
    const sync = () => setMode(root.dataset.theme === 'light' ? 'light' : 'dark');
    sync();
    const observer = new MutationObserver(sync);
    observer.observe(root, { attributes: true, attributeFilter: ['data-theme'] });
    return () => observer.disconnect();
  }, []);
  return <Theme theme={jazzTheme} mode={mode}>{children}</Theme>;
}

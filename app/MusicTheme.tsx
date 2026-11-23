"use client";

import { useEffect, useState, type ReactNode } from 'react';
import { Theme } from '@astryxdesign/core/theme';
import { jazzNotesTheme as jazzTheme } from './themes/jazz-notes';
import { metalNotesTheme as metalTheme } from './themes/metal-notes';

type Appearance = { mood: 'jazz' | 'metal'; mode: 'dark' | 'light' };

export default function MusicTheme({ children }: { children: ReactNode }) {
  const [appearance, setAppearance] = useState<Appearance>({ mood: 'jazz', mode: 'dark' });
  useEffect(() => {
    const root = document.documentElement;
    const sync = () => setAppearance(previous => {
      const mood = root.dataset.musicMood === 'metal' ? 'metal' : 'jazz';
      const mode = root.dataset.theme === 'light' ? 'light' : 'dark';
      return previous.mood === mood && previous.mode === mode ? previous : { mood, mode };
    });
    sync();
    const observer = new MutationObserver(sync);
    observer.observe(root, { attributes: true, attributeFilter: ['data-music-mood', 'data-theme'] });
    return () => observer.disconnect();
  }, []);
  return <Theme theme={appearance.mood === 'metal' ? metalTheme : jazzTheme} mode={appearance.mode}>{children}</Theme>;
}

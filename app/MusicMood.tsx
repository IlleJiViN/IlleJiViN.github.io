'use client';

import {useEffect, useState} from 'react';
import {
  SegmentedControl,
  SegmentedControlItem,
} from '@astryxdesign/core/SegmentedControl';

type MusicMood = 'jazz' | 'metal';

const STORAGE_KEY = 'blog-music-mood';

export default function MusicMood() {
  const [mood, setMood] = useState<MusicMood>('jazz');

  useEffect(() => {
    let initialMood: MusicMood = document.documentElement.dataset.musicMood === 'metal' ? 'metal' : 'jazz';

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === 'jazz' || stored === 'metal') initialMood = stored;
    } catch {}

    document.documentElement.dataset.musicMood = initialMood;
    setMood(initialMood);
  }, []);

  function changeMood(value: string) {
    if (value !== 'jazz' && value !== 'metal') return;

    setMood(value);
    document.documentElement.dataset.musicMood = value;
    try {
      localStorage.setItem(STORAGE_KEY, value);
    } catch {}
  }

  return (
    <SegmentedControl
      label="화면 분위기"
      value={mood}
      onChange={changeMood}
      size="sm">
      <SegmentedControlItem value="jazz" label="JAZZ" />
      <SegmentedControlItem value="metal" label="METAL" />
    </SegmentedControl>
  );
}

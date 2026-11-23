'use client';

import { useEffect, useState } from 'react';
import { SegmentedControl, SegmentedControlItem } from '@astryxdesign/core/SegmentedControl';

type ScoreViewMode = 'clear' | 'expressive';

export default function ScoreView() {
  const [view, setView] = useState<ScoreViewMode>('expressive');

  useEffect(() => {
    const preference = document.documentElement.dataset.scoreView;
    if (preference === 'clear' || preference === 'expressive') setView(preference);
  }, []);

  function changeView(value: string) {
    if (value !== 'clear' && value !== 'expressive') return;
    document.documentElement.dataset.scoreView = value;
    setView(value);
    try {
      localStorage.setItem('blog-score-view', value);
    } catch {
      // Keep the selection for the current page if storage is blocked.
    }
  }

  return (
    <SegmentedControl label="악보 표시 방식" value={view} onChange={changeView} size="sm">
      <SegmentedControlItem value="clear" label="명료" />
      <SegmentedControlItem value="expressive" label="디자인" />
    </SegmentedControl>
  );
}

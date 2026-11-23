import { defineTheme } from '@astryxdesign/core/theme';
import { jazzTheme } from './jazzTheme';

export const metalTheme = defineTheme({
  name: 'metal-notes',
  extends: jazzTheme,
  localTokens: {
    '--score-row-height': '92px',
    '--score-mobile-row-height': '78px',
    '--score-cover-size': '52px',
    '--score-cover-mobile-size': '40px',
    '--score-row-gap': '16px',
    '--score-page-duration': '210ms',
    '--score-page-distance': '24px',
    '--score-panel-padding': '24px',
    '--score-panel-gap': '16px',
    '--score-controls-gap': '12px',
    '--score-rule-width': '1px',
    '--music-display-font': 'Impact, "Arial Narrow", "Noto Sans KR", sans-serif',
    '--music-display-weight': '800',
    '--music-display-spacing': '.025em',
    '--music-display-case': 'uppercase',
    '--music-number-font': '"Courier New", monospace',
    '--music-number-style': 'normal',
    '--music-rule-width': '2px',
    '--music-row-gap': '22px',
    '--music-row-padding': '16px',
    '--music-motion-duration': '150ms',
    '--music-motion-easing': 'cubic-bezier(.2,.8,.2,1)',
    '--music-glow-width': '220px',
    '--music-glow-height': '120px',
    '--music-highlight-opacity': '.55',
  },
});

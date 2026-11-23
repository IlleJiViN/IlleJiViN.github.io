import ThemeToggle from './ThemeToggle';
import MusicMood from './MusicMood';

export default function BlogHeader() {
  return (
    <header className="blog-header">
      <a className="brand" href="/" aria-label="블로그 홈">ILLEJIVIN.LOG</a>
      <MusicMood />
      <nav className="header-actions" aria-label="사이트 설정과 링크">
        <ThemeToggle />
        <a href="https://github.com/IlleJiViN" target="_blank" rel="noreferrer">GitHub ↗</a>
      </nav>
    </header>
  );
}

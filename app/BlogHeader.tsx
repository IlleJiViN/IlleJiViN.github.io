import ThemeToggle from './ThemeToggle';

export default function BlogHeader() {
  return (
    <header className="blog-header">
      <a className="brand" href="/" aria-label="블로그 홈">ILLEJIVIN.LOG</a>
      <div className="header-actions">
        <ThemeToggle />
        <a href="https://github.com/IlleJiViN" target="_blank" rel="noreferrer">GitHub ↗</a>
      </div>
    </header>
  );
}

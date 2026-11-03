import Blog from "./blog/Blog";
import ThemeToggle from "./ThemeToggle";

export const metadata = {
  title: "블로그 — IlleJiViN",
  description: "프로젝트 설명, 개발 일기와 후기.",
};

export default function Home() {
  return (
    <main className="blog-page">
      <header className="blog-header">
        <a className="brand" href="/" aria-label="블로그 홈">
          <span className="brand-mark">IJ</span><span>ILLEJIVIN.LOG</span>
        </a>
        <div className="header-actions">
          <ThemeToggle />
          <a href="https://github.com/IlleJiViN" target="_blank" rel="noreferrer">GitHub ↗</a>
        </div>
      </header>
      <Blog />
    </main>
  );
}

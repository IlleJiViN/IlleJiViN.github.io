import Blog from './Blog';
import ThemeToggle from '../ThemeToggle';

export const dynamic = 'force-static';

export const metadata = { title: '블로그 — IlleJiViN', description: '프로젝트 설명, 개발 일기와 후기.' };

export default function BlogPage() {
  return <main className="blog-page"><header className="blog-header"><a href="/">← 포트폴리오</a><div className="header-actions"><ThemeToggle /><a href="https://github.com/IlleJiViN/IlleJiViN.github.io/issues/new?template=blog.yml" target="_blank" rel="noreferrer">글쓰기 ↗</a></div></header><Blog /></main>;
}

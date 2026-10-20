import Blog from './Blog';

export const metadata = { title: '블로그 — IlleJiViN', description: '프로젝트 설명, 개발 일기와 후기.' };

export default function BlogPage() {
  return <main className="blog-page"><header className="blog-header"><a href="/">← 포트폴리오</a><a href="https://github.com/IlleJiViN/IlleJiViN.github.io/issues/new?template=blog.yml" target="_blank" rel="noreferrer">글쓰기 ↗</a></header><Blog /></main>;
}

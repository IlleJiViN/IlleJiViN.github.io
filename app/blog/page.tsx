import Blog from './Blog';
import BlogHeader from '../BlogHeader';

export const dynamic = 'force-static';
export const metadata = {
  title: '블로그 — IlleJiViN',
  description: '프로젝트와 개발 기록, 일기와 음악 이야기.',
};

export default function BlogPage() {
  return <main className="blog-page"><BlogHeader /><Blog /></main>;
}

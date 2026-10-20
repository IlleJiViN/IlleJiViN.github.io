"use client";

import { useEffect, useState } from 'react';
import Markdown from 'react-markdown';
import posts from './posts.json';
import { projects } from '../projects';

type Post = { id: number; title: string; project: string; date: string; updated: string; excerpt: string; body: string; url: string };
const entries = posts as Post[];
const writeUrl = 'https://github.com/IlleJiViN/IlleJiViN.github.io/issues/new?template=blog.yml';

export default function Blog({ compact = false }: { compact?: boolean }) {
  const [project, setProject] = useState('');
  const [query, setQuery] = useState('');
  const [postId, setPostId] = useState<number | null>(null);
  useEffect(() => { const params = new URLSearchParams(window.location.search); setProject(params.get('project') || ''); setPostId(Number(params.get('post')) || null); }, []);
  const current = entries.find(post => post.id === postId);
  const filtered = entries.filter(post => (!project || post.project === project) && `${post.title} ${post.excerpt} ${post.body}`.toLowerCase().includes(query.toLowerCase()));
  function filterProject(value: string) { setProject(value); const url = new URL(window.location.href); value ? url.searchParams.set('project', value) : url.searchParams.delete('project'); window.history.replaceState(null, '', url); }
  if (postId && !compact) return current ? <article className="blog-post"><a href={`/blog/${project ? `?project=${encodeURIComponent(project)}` : ''}`}>← 글 목록</a><p className="blog-meta">{current.date} · {current.project}</p><h1>{current.title}</h1>{current.excerpt && <p className="blog-lead">{current.excerpt}</p>}<div className="blog-body"><Markdown skipHtml components={{img: ({src, alt}) => src && <img src={src} alt={alt || '프로젝트 사진'} loading="lazy" />,a: ({href, children}) => <a href={href} target="_blank" rel="noreferrer">{children}</a>}}>{current.body}</Markdown></div><a className="blog-source" href={current.url} target="_blank" rel="noreferrer">원문 · 수정 ↗</a></article> : <div className="blog-empty"><h1>글을 찾을 수 없습니다.</h1><a href="/blog/">목록으로 돌아가기 →</a></div>;
  return <div className="blog-index">{!compact && <><p className="blog-meta">ILLEJIVIN / DIARY</p><h1>작업 일기</h1><p>만든 것, 막힌 점, 그리고 배운 것.</p></>}<div className="blog-toolbar">{!compact && <><label>프로젝트<select value={project} onChange={event => filterProject(event.target.value)}><option value="">전체 프로젝트</option><option>일반 일기</option>{projects.map(item => <option key={item.name}>{item.name}</option>)}</select></label><label>검색<input type="search" placeholder="제목이나 내용 검색" value={query} onChange={event => setQuery(event.target.value)} /></label></>}<a className="blog-write" href={compact ? '/blog/' : writeUrl} target={compact ? undefined : '_blank'} rel="noreferrer">{compact ? '모든 글 →' : '글쓰기 ↗'}</a></div>{filtered.length ? <div className="blog-list">{(compact ? filtered.slice(0, 3) : filtered).map(post => <a className="blog-entry" href={`/blog/?post=${post.id}`} key={post.id}><span className="blog-meta">{post.date} · {post.project}</span><h2>{post.title}</h2>{post.excerpt && <p>{post.excerpt}</p>}<span>읽기 →</span></a>)}</div> : <div className="blog-empty"><p>{query ? '검색 결과가 없습니다.' : project ? `${project}의 첫 기록을 기다리고 있어요.` : '아직 공개된 글이 없습니다.'}</p><a href={writeUrl} target="_blank" rel="noreferrer">첫 글 쓰기 ↗</a></div>}{!compact && <details className="blog-help"><summary>글과 사진 올리는 방법</summary><ol><li>글쓰기를 누르고 GitHub에 로그인합니다.</li><li>제목·프로젝트·본문을 작성하고, 사진을 본문에 끌어넣거나 붙여넣습니다.</li><li>blog 라벨이 붙은 상태로 등록하면 배포 후 공개됩니다.</li><li>수정은 원문에서, 비공개 전환은 blog 라벨 제거 또는 글 닫기로 처리합니다.</li></ol><p>소유자 IlleJiViN의 글만 사이트에 표시됩니다. 초안은 blog 라벨 없이 저장하세요. GitHub 원문이 공개 저장소에 남으므로 비밀 초안은 올리지 마세요.</p></details>}</div>;
}

"use client";

import { useEffect, useRef, useState } from 'react';
import Markdown from 'react-markdown';
import posts from './posts.json';
import { projects } from '../projects';
import { comparePosts, getSeriesNavigation, isHiddenProject } from './series.mjs';

type Post = { id: number; title: string; project: string; order?: number | null; date: string; updated: string; excerpt: string; body: string; url: string };
type ProjectGroup = { name: string; type: string; summary: string; year: string; posts: Post[] };

const entries = posts as Post[];
const writeUrl = 'https://github.com/IlleJiViN/IlleJiViN.github.io/issues/new?template=blog.yml';
const publicProjects = projects.filter(item => item.status !== 'PRIVATE' && !isHiddenProject(item.name));
const privateProjectNames = new Set(projects.filter(item => item.status === 'PRIVATE').map(item => item.name));
const publishedEntries = entries.filter(post => !privateProjectNames.has(post.project) && !isHiddenProject(post.project));
const projectNames = new Set(publicProjects.map(item => item.name));
const extraProjectNames = [...new Set(publishedEntries.map(post => post.project))].filter(name => !projectNames.has(name));
const allGroups: ProjectGroup[] = [
  ...extraProjectNames.map(name => ({ name, type: name === '일반 일기' ? 'JOURNAL' : 'NOTES', summary: '', year: '', posts: [] as Post[] })),
  ...publicProjects.map(item => ({ name: item.name, type: item.type, summary: item.summary, year: item.year, posts: [] as Post[] })),
].map(group => ({
  ...group,
  posts: publishedEntries.filter(post => post.project === group.name).sort(comparePosts),
}));

function matchPost(post: Post, query: string) {
  return `${post.title} ${post.excerpt} ${post.body}`.toLocaleLowerCase().includes(query);
}

function visibleGroups(project: string, query: string) {
  const needle = query.trim().toLocaleLowerCase();
  return allGroups.flatMap(group => {
    if (project && group.name !== project) return [];
    if (!needle) return [group];
    const matching = group.posts.filter(post => matchPost(post, needle));
    const projectMatches = `${group.name} ${group.type} ${group.summary}`.toLocaleLowerCase().includes(needle);
    return matching.length || projectMatches ? [{ ...group, posts: projectMatches ? group.posts : matching }] : [];
  });
}

export default function Blog({ compact = false }: { compact?: boolean }) {
  const [project, setProject] = useState('');
  const [query, setQuery] = useState('');
  const [postId, setPostId] = useState<number | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set());
  const indexRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const initialProject = params.get('project') || '';
    const initialQuery = params.get('q') || '';
    setProject(initialProject);
    setQuery(initialQuery);
    setPostId(Number(params.get('post')) || null);
    if (initialProject || initialQuery) setExpanded(new Set(visibleGroups(initialProject, initialQuery).map(group => group.name)));
  }, []);

  useEffect(() => {
    const index = indexRef.current;
    if (!index) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    const groups = [...index.querySelectorAll<HTMLElement>('.project')];
    const animations = new Map<HTMLElement, Animation>();
    const removers: Array<() => void> = [];
    let frame = 0;
    let pointerX = 0;
    let pointerY = 0;

    const clearMotion = () => {
      animations.forEach(animation => animation.cancel());
      index.querySelectorAll<HTMLElement>('.project-cover').forEach(cover => {
        cover.style.removeProperty('--rotate-x');
        cover.style.removeProperty('--rotate-y');
      });
    };
    const onPreference = () => { if (reduced.matches) clearMotion(); };
    reduced.addEventListener('change', onPreference);

    for (const group of groups) {
      const button = group.querySelector<HTMLElement>('.project-toggle');
      const cover = group.querySelector<HTMLElement>('.project-cover');
      if (!button || !cover) continue;
      const onMove = (event: PointerEvent) => {
        if (reduced.matches || event.pointerType !== 'mouse') return;
        const rect = cover.getBoundingClientRect();
        const x = Math.max(-1, Math.min(1, (event.clientX - rect.left - rect.width / 2) / (rect.width / 2)));
        const y = Math.max(-1, Math.min(1, (event.clientY - rect.top - rect.height / 2) / (rect.height / 2)));
        cover.style.setProperty('--rotate-x', `${(-y * 3).toFixed(2)}deg`);
        cover.style.setProperty('--rotate-y', `${(x * 3).toFixed(2)}deg`);
      };
      const onLeave = () => {
        cover.style.removeProperty('--rotate-x');
        cover.style.removeProperty('--rotate-y');
      };
      const onFocus = () => animations.get(group)?.cancel();
      button.addEventListener('pointermove', onMove, { passive: true });
      button.addEventListener('pointerleave', onLeave);
      group.addEventListener('focusin', onFocus);
      removers.push(() => {
        button.removeEventListener('pointermove', onMove);
        button.removeEventListener('pointerleave', onLeave);
        group.removeEventListener('focusin', onFocus);
      });
    }

    const onPointer = (event: PointerEvent) => {
      if (reduced.matches || event.pointerType !== 'mouse') return;
      pointerX = event.clientX;
      pointerY = event.clientY + window.scrollY;
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        document.documentElement.style.setProperty('--pointer-x', `${pointerX}px`);
        document.documentElement.style.setProperty('--pointer-y', `${pointerY}px`);
        frame = 0;
      });
    };
    window.addEventListener('pointermove', onPointer, { passive: true });

    const observer = 'IntersectionObserver' in window ? new IntersectionObserver(changes => {
      for (const change of changes) {
        const group = change.target as HTMLElement;
        if (!change.isIntersecting || reduced.matches || group.contains(document.activeElement) || typeof group.animate !== 'function') continue;
        animations.get(group)?.cancel();
        animations.set(group, group.animate([
          { opacity: 0.55, transform: 'translateY(12px)' },
          { opacity: 1, transform: 'translateY(0)' },
        ], { duration: 480, easing: 'cubic-bezier(.22,.61,.36,1)' }));
      }
    }, { threshold: 0.16, rootMargin: '0px 0px -12px 0px' }) : null;
    groups.forEach(group => observer?.observe(group));

    return () => {
      observer?.disconnect();
      clearMotion();
      removers.forEach(remove => remove());
      reduced.removeEventListener('change', onPreference);
      window.removeEventListener('pointermove', onPointer);
      window.cancelAnimationFrame(frame);
      document.documentElement.style.removeProperty('--pointer-x');
      document.documentElement.style.removeProperty('--pointer-y');
    };
  }, [project, query, postId, compact]);

  const current = publishedEntries.find(post => post.id === postId);
  const groups = visibleGroups(project, query);
  const navigation = current ? getSeriesNavigation(publishedEntries, current) : null;

  function updateUrl(nextProject: string, nextQuery: string) {
    const url = new URL(window.location.href);
    nextProject ? url.searchParams.set('project', nextProject) : url.searchParams.delete('project');
    nextQuery ? url.searchParams.set('q', nextQuery) : url.searchParams.delete('q');
    window.history.replaceState(null, '', url);
  }
  function filterProject(value: string) {
    setProject(value);
    setExpanded(new Set(value || query ? visibleGroups(value, query).map(group => group.name) : []));
    updateUrl(value, query);
  }
  function search(value: string) {
    setQuery(value);
    setExpanded(new Set(value || project ? visibleGroups(project, value).map(group => group.name) : []));
    updateUrl(project, value);
  }
  function toggleGroup(name: string) {
    setExpanded(previous => {
      const next = new Set(previous);
      next.has(name) ? next.delete(name) : next.add(name);
      return next;
    });
  }

  if (postId && !compact) {
    return current ? (
      <article className="blog-post">
        <div className="blog-post-actions">
          <a href={`/blog/${project ? `?project=${encodeURIComponent(project)}` : ''}`}>← 글 목록</a>
          <a className="blog-edit" href={`${current.url}/edit`} target="_blank" rel="noreferrer">수정 ↗</a>
        </div>
        <p className="blog-meta">{current.date} · {current.project}{navigation && ` · ${navigation.position} / ${navigation.total}차시`}</p>
        <h1>{current.title}</h1>
        {current.excerpt && <p className="blog-lead">{current.excerpt}</p>}
        <div className="blog-body">
          <Markdown skipHtml components={{
            img: ({ src, alt }) => src && <img src={src} alt={alt || '프로젝트 사진'} loading="lazy" />,
            a: ({ href, children }) => <a href={href} target="_blank" rel="noreferrer">{children}</a>,
          }}>{current.body}</Markdown>
        </div>
        <a className="blog-source" href={current.url} target="_blank" rel="noreferrer">GitHub 원문 ↗</a>
        {navigation && <nav className="post-pagination" aria-label="같은 프로젝트의 이전·다음 글">
          {navigation.previous ? <a className="post-pagination-item" rel="prev" href={`/blog/?post=${navigation.previous.id}&project=${encodeURIComponent(current.project)}`}>
            <span className="post-pagination-label">← 이전 글</span>
            <span className="post-pagination-title">{navigation.previous.title}</span>
          </a> : <span className="post-pagination-item is-disabled"><span className="post-pagination-label">이전 글 없음</span></span>}
          {navigation.next ? <a className="post-pagination-item post-pagination-next" rel="next" href={`/blog/?post=${navigation.next.id}&project=${encodeURIComponent(current.project)}`}>
            <span className="post-pagination-label">다음 글 →</span>
            <span className="post-pagination-title">{navigation.next.title}</span>
          </a> : <span className="post-pagination-item post-pagination-next is-disabled"><span className="post-pagination-label">다음 글 없음</span></span>}
        </nav>}
      </article>
    ) : <div className="blog-empty"><h1>글을 찾을 수 없습니다.</h1><a href="/blog/">목록으로 돌아가기 →</a></div>;
  }

  return (
    <div className="blog-index" ref={indexRef}>
      <div className="blog-index-heading"><h1>Projects</h1></div>
      <div className="blog-toolbar">
        {!compact && <>
          <label>프로젝트<select value={project} onChange={event => filterProject(event.target.value)}><option value="">전체 프로젝트</option>{allGroups.map(group => <option key={group.name}>{group.name}</option>)}</select></label>
          <label>검색<input type="search" placeholder="제목이나 내용 검색" value={query} onChange={event => search(event.target.value)} /></label>
        </>}
        <a className="blog-write" href={compact ? '/blog/' : writeUrl} target={compact ? undefined : '_blank'} rel="noreferrer">{compact ? '모든 글 →' : '글쓰기 ↗'}</a>
      </div>
      {groups.length ? (
        <div className="project-list">
          {(compact ? groups.slice(0, 3) : groups).map(group => {
            const position = allGroups.indexOf(allGroups.find(item => item.name === group.name)!) + 1;
            const id = `project-tracks-${position}`;
            const isExpanded = expanded.has(group.name);
            return <article className="project" key={group.name}>
              <h2 className="project-heading">
                <button type="button" className="project-toggle" aria-expanded={isExpanded} aria-controls={id} onClick={() => toggleGroup(group.name)}>
                  <span className="project-number">{String(position).padStart(2, '0')}</span>
                  <span className="project-cover" aria-hidden="true" />
                  <span className="project-copy">
                    <span className="project-name-line"><span className="project-title">{group.name}</span><span className="project-meta">{group.type}</span></span>
                    {group.summary && <span className="project-description">{group.summary}</span>}
                  </span>
                  <span className="project-chevron" aria-hidden="true">+</span>
                </button>
              </h2>
              <div className="project-tracks" id={id} hidden={!isExpanded}>
                {group.posts.length ? group.posts.map(post => {
                  const chapter = allGroups.find(item => item.name === group.name)!.posts.findIndex(item => item.id === post.id) + 1;
                  return <a className="track-row" href={`/blog/?post=${post.id}&project=${encodeURIComponent(group.name)}`} key={post.id}>
                    <span className="track-number">{String(chapter).padStart(2, '0')}</span>
                    <span className="track-copy"><span className="track-title">{post.title}</span>{post.excerpt && <span className="track-excerpt">{post.excerpt}</span>}</span>
                    <time className="track-date" dateTime={post.date}>{post.date}</time>
                  </a>;
                }) : <p className="project-empty">공개된 글이 없습니다.</p>}
              </div>
            </article>;
          })}
        </div>
      ) : <div className="blog-empty"><p>{query ? '검색 결과가 없습니다.' : '공개된 프로젝트가 없습니다.'}</p><button type="button" className="blog-reset" onClick={() => { setProject(''); setQuery(''); setExpanded(new Set()); updateUrl('', ''); }}>전체 보기</button></div>}
      {!compact && <details className="blog-help"><summary>글과 사진 올리는 방법</summary><ol><li>글쓰기를 누르고 GitHub에 로그인합니다.</li><li>제목·프로젝트·본문을 작성하고, 사진을 본문에 끌어넣거나 붙여넣습니다.</li><li>차시 순서에 양의 정수를 넣으면 같은 프로젝트 안에서 작은 숫자부터 정렬됩니다. 비워둔 글은 번호 있는 글 뒤에 작성일 순서로 표시됩니다. 같은 번호는 작성일·글 번호 순서로 정렬됩니다.</li><li>blog 라벨이 붙은 상태로 등록하면 배포 후 공개됩니다.</li><li>글 상세의 수정 버튼으로 GitHub에서 내용을 고칠 수 있습니다. 비공개 전환은 blog 라벨 제거 또는 글 닫기로 처리합니다.</li></ol><p>소유자 IlleJiViN의 글만 사이트에 표시됩니다. 초안은 blog 라벨 없이 저장하세요.</p></details>}
    </div>
  );
}

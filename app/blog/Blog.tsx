"use client";

import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent, type KeyboardEvent as ReactKeyboardEvent, type MouseEvent as ReactMouseEvent } from 'react';
import { Button } from '@astryxdesign/core/Button';
import { Icon } from '@astryxdesign/core/Icon';
import Markdown from 'react-markdown';
import posts from './posts.json';
import { projects } from '../projects';
import { comparePosts, getSeriesNavigation, isHiddenProject } from './series.mjs';
import useProjectMotion from './useProjectMotion';

type Post = { id: number; title: string; project: string; order?: number | null; date: string; updated: string; excerpt: string; body: string; url: string };
type ProjectGroup = { name: string; type: string; summary: string; year: string; posts: Post[] };

const PAGE_SIZE = 5;
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
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [direction, setDirection] = useState<'next' | 'previous'>('next');
  const swipeStart = useRef<{ id: number; x: number; y: number; horizontal: boolean } | null>(null);
  const suppressSwipeClick = useRef(false);
  const indexRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const initialProject = params.get('project') || '';
    const initialQuery = params.get('q') || '';
    setProject(initialProject);
    setQuery(initialQuery);
    setPostId(Number(params.get('post')) || null);
    if (initialProject || initialQuery) {
      const matches = visibleGroups(initialProject, initialQuery);
      setSelectedProject((matches.slice(0, PAGE_SIZE).find(group => group.posts.length > 0) || matches[0])?.name || null);
    }
  }, []);

  const current = publishedEntries.find(post => post.id === postId);
  const groups = visibleGroups(project, query);
  const navigation = current ? getSeriesNavigation(publishedEntries, current) : null;
  const availableGroups = compact ? groups.slice(0, PAGE_SIZE) : groups;
  const pageCount = Math.max(1, Math.ceil(availableGroups.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount - 1);
  const pageGroups = availableGroups.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE);
  const selectedGroup = pageGroups.find(group => group.name === selectedProject) || null;
  const selectedFullGroup = selectedGroup ? allGroups.find(group => group.name === selectedGroup.name)! : null;

  useProjectMotion(indexRef, project, query, postId, compact, currentPage);

  function updateUrl(nextProject: string, nextQuery: string) {
    const url = new URL(window.location.href);
    nextProject ? url.searchParams.set('project', nextProject) : url.searchParams.delete('project');
    nextQuery ? url.searchParams.set('q', nextQuery) : url.searchParams.delete('q');
    window.history.replaceState(null, '', url);
  }
  function selectFirstMatch(nextProject: string, nextQuery: string) {
    const matches = visibleGroups(nextProject, nextQuery);
    const first = nextProject || nextQuery ? matches.slice(0, PAGE_SIZE).find(group => group.posts.length > 0) || matches[0] : null;
    setSelectedProject(first?.name || null);
    setPage(0);
    setDirection('next');
  }
  function filterProject(value: string) {
    setProject(value);
    selectFirstMatch(value, query);
    updateUrl(value, query);
  }
  function search(value: string) {
    setQuery(value);
    selectFirstMatch(project, value);
    updateUrl(project, value);
  }
  function toggleGroup(name: string) {
    setSelectedProject(previous => previous === name ? null : name);
  }
  function movePage(offset: number) {
    const nextPage = Math.max(0, Math.min(pageCount - 1, currentPage + offset));
    if (nextPage === currentPage) return;
    setDirection(offset > 0 ? 'next' : 'previous');
    setPage(nextPage);
    setSelectedProject(null);
  }
  function onScoreKeyDown(event: ReactKeyboardEvent<HTMLElement>) {
    if (event.target !== event.currentTarget) return;
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      movePage(event.key === 'ArrowRight' ? 1 : -1);
    }
  }
  function onScorePointerDown(event: ReactPointerEvent<HTMLElement>) {
    if (!event.isPrimary || event.button !== 0) return;
    suppressSwipeClick.current = false;
    swipeStart.current = { id: event.pointerId, x: event.clientX, y: event.clientY, horizontal: false };
  }
  function onScorePointerMove(event: ReactPointerEvent<HTMLElement>) {
    const start = swipeStart.current;
    if (!start || start.id !== event.pointerId) return;
    if (event.buttons === 0) { swipeStart.current = null; return; }
    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;
    if (!start.horizontal && Math.abs(dx) > 12 && Math.abs(dx) > Math.abs(dy) * 1.3) {
      start.horizontal = true;
      event.currentTarget.setPointerCapture(event.pointerId);
    }
    if (start.horizontal && event.cancelable) event.preventDefault();
  }
  function onScorePointerUp(event: ReactPointerEvent<HTMLElement>) {
    const start = swipeStart.current;
    swipeStart.current = null;
    if (!start || start.id !== event.pointerId) return;
    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;
    if (Math.abs(dx) >= 45 && Math.abs(dx) > Math.abs(dy) * 1.3) {
      suppressSwipeClick.current = true;
      event.preventDefault();
      movePage(dx < 0 ? 1 : -1);
      window.setTimeout(() => { suppressSwipeClick.current = false; }, 0);
    }
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  }
  function onScoreClick(event: ReactMouseEvent<HTMLElement>) {
    if (suppressSwipeClick.current) {
      event.preventDefault();
      event.stopPropagation();
      suppressSwipeClick.current = false;
    }
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
      {availableGroups.length ? (
        <section className="score-shell" aria-label="프로젝트 악보">
          <nav className="score-controls" aria-label="프로젝트 페이지 이동">
            <Button label="이전" icon={<Icon icon="chevronLeft" />} size="sm" variant="ghost" isDisabled={currentPage === 0} onClick={() => movePage(-1)} />
            <output className="score-position" aria-live="polite" aria-atomic="true">{currentPage + 1} / {pageCount}</output>
            <Button label="다음" endContent={<Icon icon="chevronRight" />} size="sm" variant="ghost" isDisabled={currentPage === pageCount - 1} onClick={() => movePage(1)} />
          </nav>
          <section
            className="score-viewport"
            tabIndex={0}
            role="region"
            aria-roledescription="carousel"
            aria-label={`프로젝트 ${currentPage + 1}쪽, 총 ${pageCount}쪽`}
            aria-keyshortcuts="ArrowLeft ArrowRight"
            onKeyDown={onScoreKeyDown}
            onPointerDown={onScorePointerDown}
            onPointerMove={onScorePointerMove}
            onPointerUp={onScorePointerUp}
            onPointerCancel={() => { swipeStart.current = null; }}
            onClickCapture={onScoreClick}>
            <ol className="score-page project-list" key={JSON.stringify([project, query, currentPage])} data-direction={direction}>
              {pageGroups.map(group => {
                const fullGroup = allGroups.find(item => item.name === group.name)!;
                const position = allGroups.indexOf(fullGroup) + 1;
                const isExpanded = selectedGroup?.name === group.name;
                return <li className="project" key={group.name}>
                  <h2 className="project-heading" id={`project-heading-${position}`}>
                    <button type="button" className="project-toggle" aria-expanded={isExpanded} aria-controls="score-project-detail" onClick={() => toggleGroup(group.name)}>
                      <span className="project-number">{String(position).padStart(2, '0')}</span>
                      <span className="project-cover" aria-hidden="true" />
                      <span className="project-copy">
                        <span className="project-name-line"><span className="project-title">{group.name}</span><span className="project-meta">{group.type}</span>{fullGroup.posts.length > 0 && <span className="project-count">{fullGroup.posts.length}편</span>}</span>
                      </span>
                      <span className="project-chevron" aria-hidden="true">+</span>
                    </button>
                  </h2>
                </li>;
              })}
              {Array.from({ length: PAGE_SIZE - pageGroups.length }, (_, index) => <li className="score-empty-line" aria-hidden="true" key={`empty-${index}`} />)}
            </ol>
          </section>
          <section className="score-detail project-tracks" id="score-project-detail" aria-label={selectedGroup ? `${selectedGroup.name}의 글 목록` : '프로젝트 글 목록'} hidden={!selectedGroup}>
            {selectedGroup?.summary && <p className="project-description">{selectedGroup.summary}</p>}
            {selectedGroup && (selectedGroup.posts.length ? selectedGroup.posts.map(post => {
              const chapter = selectedFullGroup!.posts.findIndex(item => item.id === post.id) + 1;
              return <a className="track-row" href={`/blog/?post=${post.id}&project=${encodeURIComponent(selectedGroup.name)}`} key={post.id}>
                <span className="track-number">{String(chapter).padStart(2, '0')}</span>
                <span className="track-copy"><span className="track-title">{post.title}</span>{post.excerpt && <span className="track-excerpt">{post.excerpt}</span>}</span>
                <time className="track-date" dateTime={post.date}>{post.date}</time>
              </a>;
            }) : <p className="project-empty">공개된 글이 없습니다.</p>)}
          </section>
        </section>
      ) : <div className="blog-empty"><p>{query ? '검색 결과가 없습니다.' : '공개된 프로젝트가 없습니다.'}</p><button type="button" className="blog-reset" onClick={() => { setProject(''); setQuery(''); setSelectedProject(null); setPage(0); updateUrl('', ''); }}>전체 보기</button></div>}
      {!compact && <details className="blog-help"><summary>글과 사진 올리는 방법</summary><ol><li>글쓰기를 누르고 GitHub에 로그인합니다.</li><li>제목·프로젝트·본문을 작성하고, 사진을 본문에 끌어넣거나 붙여넣습니다.</li><li>차시 순서에 양의 정수를 넣으면 같은 프로젝트 안에서 작은 숫자부터 정렬됩니다. 비워둔 글은 번호 있는 글 뒤에 작성일 순서로 표시됩니다. 같은 번호는 작성일·글 번호 순서로 정렬됩니다.</li><li>blog 라벨이 붙은 상태로 등록하면 배포 후 공개됩니다.</li><li>글 상세의 수정 버튼으로 GitHub에서 내용을 고칠 수 있습니다. 비공개 전환은 blog 라벨 제거 또는 글 닫기로 처리합니다.</li></ol><p>소유자 IlleJiViN의 글만 사이트에 표시됩니다. 초안은 blog 라벨 없이 저장하세요.</p></details>}
    </div>
  );
}

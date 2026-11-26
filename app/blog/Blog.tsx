"use client";

import { lazy, Suspense, useEffect, useRef, useState, type MouseEvent } from 'react';
import Markdown from 'react-markdown';
import posts from './posts.json';
import { projects } from '../projects';
import { comparePosts, getSeriesNavigation, isHiddenProject } from './series.mjs';
import useProjectMotion from './useProjectMotion';
import useScoreSlider from './useScoreSlider';
import DrumScore, { DrumStaffStamp } from './TabScore';
import type { PostTab } from './tabScore.mjs';

type Post = { id: number; title: string; project: string; order?: number | null; date: string; updated: string; excerpt: string; body: string; url: string; tab?: PostTab };
type ProjectGroup = { name: string; type: string; summary: string; year: string; posts: Post[] };
type Reveal = 'project' | 'reader' | { chapterId: number };

const DrumComposer = lazy(() => import('./TabComposer'));
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
  return `${post.title} ${post.excerpt} ${post.body} ${post.tab?.mood ?? ''}`.toLocaleLowerCase().includes(query);
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

function focusAndScroll(anchor: HTMLElement, focus: HTMLElement) {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isClear = document.documentElement.dataset.scoreView === 'clear';
  focus.focus({ preventScroll: true });
  anchor.scrollIntoView({ block: 'start', behavior: reduceMotion || isClear ? 'instant' : 'smooth' });
}

export default function Blog({ compact = false }: { compact?: boolean }) {
  const [project, setProject] = useState('');
  const [query, setQuery] = useState('');
  const [postId, setPostId] = useState<number | null>(null);
  const [editTab, setEditTab] = useState(false);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const indexRef = useRef<HTMLDivElement>(null);
  const detailRef = useRef<HTMLElement>(null);
  const readerRef = useRef<HTMLElement>(null);
  const pendingReveal = useRef<Reveal | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const initialPostId = Number(params.get('post')) || null;
    const linkedPost = compact ? undefined : publishedEntries.find(post => post.id === initialPostId);
    const initialEdit = params.get('tab') === 'edit' && (!initialPostId || Boolean(linkedPost));
    const initialProject = linkedPost?.project || params.get('project') || '';
    const initialQuery = linkedPost ? '' : params.get('q') || '';
    setProject(initialProject);
    setQuery(initialQuery);
    setPostId(initialPostId);
    setEditTab(initialEdit);
    if (linkedPost && !initialEdit) pendingReveal.current = 'reader';
    if (initialProject || initialQuery) {
      const matches = visibleGroups(initialProject, initialQuery);
      setSelectedProject((matches.slice(0, PAGE_SIZE).find(group => group.posts.length > 0) || matches[0])?.name || null);
    }
  }, [compact]);

  const current = publishedEntries.find(post => post.id === postId);
  const groups = visibleGroups(project, query);
  const navigation = current ? getSeriesNavigation(publishedEntries, current) : null;
  const previousPost = navigation?.previous;
  const nextPost = navigation?.next;
  const availableGroups = compact ? groups.slice(0, PAGE_SIZE) : groups;
  const pages = Array.from({ length: Math.ceil(availableGroups.length / PAGE_SIZE) }, (_, page) =>
    availableGroups.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE));
  const { viewportRef, currentPage, sliderProps } = useScoreSlider(pages.length, JSON.stringify([project, query]));
  const selectedGroup = availableGroups.find(group => group.name === selectedProject) || null;
  const selectedFullGroup = selectedGroup ? allGroups.find(group => group.name === selectedGroup.name)! : null;

  useProjectMotion(indexRef, project, query, compact);

  useEffect(() => {
    const reveal = pendingReveal.current;
    if (!reveal) return;
    const detail = detailRef.current;
    const anchor = reveal === 'reader' ? readerRef.current : detail;
    if (!anchor || anchor.hidden) return;
    const heading = anchor.querySelector<HTMLElement>('h2');
    const chapter = typeof reveal === 'object'
      ? detail?.querySelector<HTMLElement>(`#score-chapter-${reveal.chapterId}`)
      : null;
    pendingReveal.current = null;
    const focus = chapter || heading;
    if (focus) focusAndScroll(chapter || anchor, focus);
  }, [selectedProject, postId]);

  function updateUrl(nextProject: string, nextQuery: string) {
    const url = new URL(window.location.href);
    nextProject ? url.searchParams.set('project', nextProject) : url.searchParams.delete('project');
    nextQuery ? url.searchParams.set('q', nextQuery) : url.searchParams.delete('q');
    url.searchParams.delete('post');
    url.searchParams.delete('tab');
    window.history.replaceState(window.history.state, '', url);
  }
  function selectFirstMatch(nextProject: string, nextQuery: string) {
    pendingReveal.current = null;
    setPostId(null);
    const matches = visibleGroups(nextProject, nextQuery);
    const first = nextProject || nextQuery ? matches.slice(0, PAGE_SIZE).find(group => group.posts.length > 0) || matches[0] : null;
    setSelectedProject(first?.name || null);
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
    const next = selectedProject === name ? null : name;
    pendingReveal.current = next ? 'project' : null;
    setPostId(null);
    setSelectedProject(next);
  }

  function readChapter(event: MouseEvent<HTMLAnchorElement>, id: number) {
    if (compact || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    if (postId === id) {
      const reader = readerRef.current;
      const heading = reader?.querySelector('h2');
      if (reader && heading) focusAndScroll(reader, heading);
      return;
    }
    pendingReveal.current = 'reader';
    setPostId(id);
  }

  function closeChapter(id: number) {
    pendingReveal.current = { chapterId: id };
    setPostId(null);
  }

  if (editTab && !compact && (!postId || current)) {
    const backUrl = current ? `/blog/?post=${current.id}&project=${encodeURIComponent(current.project)}` : '/blog/';
    return (
      <section className="blog-tab-workspace" aria-label="드럼 악보 작성">
        <p className="blog-tab-back"><a href={backUrl}>← {current ? '글로 돌아가기' : '프로젝트로 돌아가기'}</a></p>
        <Suspense fallback={<p role="status">악보 편집기를 여는 중…</p>}>
          <DrumComposer
            initialScore={current?.tab?.score}
            initialDifficulty={current?.tab?.difficulty}
            initialMood={current?.tab?.mood}
            issueUrl={current?.url ?? writeUrl}
            isExisting={Boolean(current)}
          />
        </Suspense>
      </section>
    );
  }

  const reader = current && !compact && (
      <article className="blog-post" key={current.id} aria-labelledby="score-post-title">
        <div className="blog-post-actions">
          <button type="button" className="blog-post-close" onClick={() => closeChapter(current.id)}>← 글 목록</button>
          <nav className="blog-write-actions" aria-label="글 편집">
            <a className="blog-edit" href={`/blog/?post=${current.id}&project=${encodeURIComponent(current.project)}&tab=edit`}>드럼 악보 편집</a>
            <a className="blog-edit" href={`${current.url}/edit`} target="_blank" rel="noreferrer">수정 ↗</a>
          </nav>
        </div>
        <header className="blog-post-score">
          {navigation && !current.tab?.score && <DrumStaffStamp chapter={navigation.position} />}
          <p className="blog-meta">{current.date} · {current.project}{navigation && ` · ${navigation.position} / ${navigation.total}차시`}</p>
        </header>
        <h2 className="blog-post-title" id="score-post-title" tabIndex={-1}>{current.title}</h2>
        {current.excerpt && <p className="blog-lead">{current.excerpt}</p>}
        {current.tab && <aside className="blog-authored-tab" aria-label="이 글의 드럼 악보">
          <DrumScore score={current.tab.score} difficulty={current.tab.difficulty} mood={current.tab.mood} />
        </aside>}
        <div className="blog-body">
          <Markdown skipHtml components={{
            img: ({ src, alt }) => src && <img src={src} alt={alt || '프로젝트 사진'} loading="lazy" />,
            a: ({ href, children }) => <a href={href} target="_blank" rel="noreferrer">{children}</a>,
          }}>{current.body}</Markdown>
        </div>
        <a className="blog-source" href={current.url} target="_blank" rel="noreferrer">GitHub 원문 ↗</a>
        {navigation && <nav className="post-pagination" aria-label="같은 프로젝트의 이전·다음 글">
          {previousPost ? <a className="post-pagination-item" rel="prev" href={`/blog/?post=${previousPost.id}&project=${encodeURIComponent(current.project)}`} onClick={event => readChapter(event, previousPost.id)}>
            <span className="post-pagination-label">← 이전 글</span>
            <span className="post-pagination-title">{previousPost.title}</span>
          </a> : <span className="post-pagination-item is-disabled"><span className="post-pagination-label">이전 글 없음</span></span>}
          {nextPost ? <a className="post-pagination-item post-pagination-next" rel="next" href={`/blog/?post=${nextPost.id}&project=${encodeURIComponent(current.project)}`} onClick={event => readChapter(event, nextPost.id)}>
            <span className="post-pagination-label">다음 글 →</span>
            <span className="post-pagination-title">{nextPost.title}</span>
          </a> : <span className="post-pagination-item post-pagination-next is-disabled"><span className="post-pagination-label">다음 글 없음</span></span>}
        </nav>}
      </article>
  );

  return (
    <div className="blog-index" ref={indexRef}>
      <div className="blog-index-heading"><h1>Projects</h1></div>
      {postId && !current && !compact ? <p className="blog-empty" role="status">글을 찾을 수 없습니다.</p> : null}
      <div className="blog-toolbar">
        {!compact && <>
          <label>프로젝트<select value={project} onChange={event => filterProject(event.target.value)}><option value="">전체 프로젝트</option>{allGroups.map(group => <option key={group.name}>{group.name}</option>)}</select></label>
          <label>검색<input type="search" placeholder="제목이나 내용 검색" value={query} onChange={event => search(event.target.value)} /></label>
        </>}
        <nav className="blog-write-actions" aria-label="블로그 작성">
          {!compact && <a className="blog-write" href="/blog/?tab=edit">드럼 악보 쓰기</a>}
          <a className="blog-write" href={compact ? '/blog/' : writeUrl} target={compact ? undefined : '_blank'} rel="noreferrer">{compact ? '모든 글 →' : '글쓰기 ↗'}</a>
        </nav>
      </div>
      {pages.length > 0 ? (
        <section className="score-shell" aria-label="프로젝트 악보">
          {pages.length > 1 && <header className="score-status">
            <p id="score-hint">악보를 좌우로 밀기</p>
            <output className="score-position" aria-live="polite" aria-atomic="true" aria-label="현재 악보 쪽">{currentPage + 1} / {pages.length}</output>
          </header>}
          <section
            ref={viewportRef}
            className="score-viewport"
            data-scrollable={pages.length > 1}
            tabIndex={pages.length > 1 ? 0 : undefined}
            role="region"
            aria-roledescription="carousel"
            aria-label="프로젝트 악보 펼침면"
            aria-describedby={pages.length > 1 ? 'score-hint' : undefined}
            aria-keyshortcuts={pages.length > 1 ? 'ArrowLeft ArrowRight Home End' : undefined}
            {...sliderProps}>
            {pages.map((pageGroups, pageIndex) => (
              <section className="score-slide" aria-label={`악보 ${pageIndex + 1}쪽`} key={pageIndex}>
                <span className="score-clef" aria-hidden="true">𝄞</span>
                <ul className="score-page">
                  {pageGroups.map(group => {
                    const fullGroup = allGroups.find(item => item.name === group.name)!;
                    return <li className="project" key={group.name}>
                      <h2 className="project-heading">
                        <button
                          type="button"
                          className="project-toggle"
                          aria-expanded={selectedGroup?.name === group.name}
                          aria-controls="score-project-detail"
                          onClick={() => toggleGroup(group.name)}>
                          <span className="project-cover" aria-hidden="true" />
                          <span className="project-copy">
                            <span className="project-name-line">
                              <span className="project-title">{group.name}</span>
                              <span className="project-meta">{group.type}</span>
                              {fullGroup.posts.length > 0 && <span className="project-count">{fullGroup.posts.length}편</span>}
                            </span>
                          </span>
                          <span className="project-chevron" aria-hidden="true">+</span>
                        </button>
                      </h2>
                    </li>;
                  })}
                  {Array.from({ length: PAGE_SIZE - pageGroups.length }, (_, index) => <li className="score-empty-line" aria-hidden="true" key={index} />)}
                </ul>
              </section>
            ))}
          </section>
          <section className="score-detail" ref={detailRef} id="score-project-detail" aria-labelledby="score-detail-heading" hidden={!selectedGroup}>
            {selectedGroup && <article className="tab-project" key={selectedGroup.name}>
              <header className="tab-project-heading">
                <h2 id="score-detail-heading" tabIndex={-1}>{selectedGroup.name}</h2>
                {selectedGroup.summary && <p className="project-description">{selectedGroup.summary}</p>}
              </header>
              {selectedGroup.posts.length > 0 ? <ol className="tab-chapters">
                {selectedGroup.posts.map(post => {
                  const chapter = selectedFullGroup!.posts.findIndex(item => item.id === post.id) + 1;
                  return <li key={post.id}>
                    <a className="track-row" id={`score-chapter-${post.id}`} href={`/blog/?post=${post.id}&project=${encodeURIComponent(selectedGroup.name)}`}
                      aria-current={current?.id === post.id ? 'true' : undefined} onClick={event => readChapter(event, post.id)}>
                      <DrumStaffStamp chapter={chapter} />
                      <span className="track-copy">
                        <span className="track-chapter">{chapter}차시</span>
                        <span className="track-title">{post.title}</span>
                        {post.excerpt && <span className="track-excerpt">{post.excerpt}</span>}
                      </span>
                      <time className="track-date" dateTime={post.date}>{post.date}</time>
                    </a>
                    {post.tab && <aside className="chapter-authored-tab" aria-label={`${chapter}차시 드럼 악보`}>
                      <DrumScore score={post.tab.score} difficulty={post.tab.difficulty} mood={post.tab.mood} compact />
                    </aside>}
                  </li>;
                })}
              </ol> : <>
                <DrumStaffStamp chapter={0} />
                <p className="project-empty">공개된 글이 없습니다.</p>
              </>}
              {!compact && <section className="inline-reader" ref={readerRef} aria-label="글 읽기" hidden={!reader}>
                {reader}
              </section>}
            </article>}
          </section>
        </section>
      ) : <div className="blog-empty"><p>{query ? '검색 결과가 없습니다.' : '공개된 프로젝트가 없습니다.'}</p><button type="button" className="blog-reset" onClick={() => { setProject(''); setQuery(''); selectFirstMatch('', ''); updateUrl('', ''); }}>전체 보기</button></div>}
      {!compact && <details className="blog-help"><summary>글과 사진 올리는 방법</summary><ol><li>글쓰기를 누르고 GitHub에 로그인합니다.</li><li>제목·프로젝트·본문을 작성하고, 사진을 본문에 끌어넣거나 붙여넣습니다.</li><li>차시 순서에 양의 정수를 넣으면 같은 프로젝트 안에서 작은 숫자부터 정렬됩니다. 비워둔 글은 번호 있는 글 뒤에 작성일 순서로 표시됩니다. 같은 번호는 작성일·글 번호 순서로 정렬됩니다.</li><li>blog 라벨이 붙은 상태로 등록하면 배포 후 공개됩니다.</li><li>글 상세의 수정 버튼으로 GitHub에서 내용을 고칠 수 있습니다. 비공개 전환은 blog 라벨 제거 또는 글 닫기로 처리합니다.</li></ol><p>소유자 IlleJiViN의 글만 사이트에 표시됩니다. 초안은 blog 라벨 없이 저장하세요.</p></details>}
    </div>
  );
}

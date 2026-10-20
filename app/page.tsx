import { projects } from "./projects";
import Blog from "./blog/Blog";

const highlights = [
  {name: "MalSight", text: "PE → CFG → 그래프 표현 → 분류·설명까지 연결한 악성코드 정적 분석 연구 MVP. 내부 평가를 실제 신종 탐지 성능과 구분합니다.", tech: "Python · Capstone · GIN/JEPA · XAI"},
  {name: "SpotSync", text: "장소 데이터 수집, NER, 벡터·공간 검색과 재순위를 React UI에 연결한 팀 프로젝트 계열입니다.", tech: "BGE-M3 · ColBERT · PostGIS · React"},
  {name: "SemVid", text: "자막, 의미 기반 영상 검색과 FFmpeg 렌더링을 연결한 영상 자동화 파이프라인입니다. 실제 API·모델 통합 실행은 추가 검증이 필요합니다.", tech: "Whisper · Gemini · ColBERT · FFmpeg"},
  {name: "에이전트 개발 도구", text: "Codex에서 Antigravity CLI로 작업을 위임하는 MCP 플러그인과 웹사이트에 설치하는 에이전트 SDK를 개발했습니다.", tech: "TypeScript · MCP · CLI · DOM"},
];


function Arrow() { return <span aria-hidden="true">↗</span>; }

export default function Home() {
  return (
    <main>
      <header className="site-header">
        <a className="brand" href="#top" aria-label="처음으로"><span className="brand-mark">IJ</span><span>ILLEJIVIN.LOG</span></a>
        <nav aria-label="주요 메뉴"><a href="#profile">소개</a><a href="#current">최근 작업</a><a href="#projects">전체 작업</a><a href="/blog/">블로그</a><a href="#timeline">연혁</a></nav>
        <a className="github-link" href="https://github.com/IlleJiViN" target="_blank" rel="noreferrer">GitHub <Arrow /></a>
      </header>

      <section className="hero" id="top">
        <h1>프로젝트와 연구 기록</h1>
        <p className="hero-date">IlleJiViN · 2026.10</p>
      </section>

      <section className="section profile-section" id="profile">
        <div className="section-heading"><div><span className="section-number">INTRO</span><h2>What I build</h2></div><p>해커톤 지원용 프로젝트 기반 소개</p></div>
        <p className="profile-copy">Python과 TypeScript를 중심으로 AI 모델을 검색·자동화 서비스와 연결하는 프로젝트를 진행했습니다. 장소 추천 서비스 SpotSync, 영상 자동화 SemVid, 악성코드 분석 MalSight와 에이전트 개발 도구를 만들었고, 최근에는 오목 자가대국 AI, 자율주행 비전 강건성, 초파리 커넥톰 기반 제어를 연구하고 있습니다.</p>
        <div className="skill-list"><span>AI 모델·데이터 파이프라인</span><span>API·웹 인터페이스 연결</span><span>검색·RAG·자동화</span><span>실험 설계·평가·문서화</span></div>
        <div className="highlights">{highlights.map(item => <article key={item.name}><h3>{item.name}</h3><p>{item.text}</p><small>{item.tech}</small></article>)}</div>
        <p className="scope-note">팀 프로젝트의 개인 담당 범위는 지원서에서 별도로 명시합니다. 아래 목록에는 학습·초기 설정 기록도 포함되며, 항목 수를 완성 프로젝트 수로 계산하지 않습니다.</p>
      </section>

      <section className="section current-section" id="current">
        <div className="section-heading"><div><span className="section-number">NOW</span><h2>Current work</h2></div><p>2026년 10월 기준 · 최근 구현과 진행 중인 연구</p></div>
        <div className="current-list">{projects.filter(item => item.year === "2026.10").map(item => <article key={item.name}><span className="project-status">{item.status}</span><h3>{item.name}</h3><p>{item.summary}</p>{item.href && <a href={item.href} target="_blank" rel="noreferrer">코드와 문서 ↗</a>}</article>)}</div>
      </section>

      <section className="section" id="projects">
        <div className="section-heading"><div><span className="section-number">01</span><h2>All work</h2></div><p>첫 기록부터 최근 연구까지 {projects.length}개 작업 기록을 시간순으로 정리했습니다. 공개 작업은 코드로 연결하고, 비공개 작업은 설명과 상태를 표시합니다.</p></div>
        <div className="project-grid">
          {projects.map((project, index) => {
            const content = <><div className="project-top"><span>{String(index + 1).padStart(2, "0")} / {project.year}</span><span className="project-status">{project.status}</span></div><div><p className="project-type">{project.type}</p><h3>{project.name}</h3><p className="project-summary">{project.summary}</p></div><div className="project-footer"><span>{project.detail}</span>{project.href && <span className="project-arrow"><Arrow /></span>}</div></>;
            return <article className="project-card" key={project.name}>{content}<div className="project-actions">{project.href && <a href={project.href} target="_blank" rel="noreferrer">GitHub ↗</a>}<a href={`/blog/?project=${encodeURIComponent(project.name)}`}>관련 글 →</a></div></article>;
          })}
        </div>
      </section>

      <section className="manifesto" aria-label="개발 원칙"><p>MAKE THE SYSTEM</p><p>SHOW THE TRADE-OFFS</p><p>LEAVE A TRACE<span>.</span></p></section>

      <section className="section" id="notes">
        <div className="section-heading"><div><span className="section-number">02</span><h2>Blog</h2></div><p>프로젝트 설명, 작업 일기와 후기.</p></div>
        <Blog compact />
      </section>

      <section className="section timeline-section" id="timeline">
        <div className="section-heading"><div><span className="section-number">03</span><h2>Trajectory</h2></div><p>저장소의 수가 아니라 문제를 다루는 범위가 넓어진 과정.</p></div>
        <ol className="timeline">
          <li><span>2024</span><strong>게임 시스템</strong><p>Pygame으로 이동, 카메라, AI, 충돌과 투사체를 직접 구현.</p></li>
          <li><span>2025</span><strong>알고리즘 × ML</strong><p>루빅스 큐브 탐색과 브라우저 뉴스 분류로 문제 영역 확장.</p></li>
          <li><span>2026 H1</span><strong>제품과 데이터</strong><p>검색 모델, 공간 데이터와 팀 서비스를 하나의 파이프라인으로 연결.</p></li>
          <li><span>2026 H2</span><strong>도구와 연구</strong><p>오픈소스 플러그인, 네이티브 앱과 설명 가능한 보안 연구로 심화.</p></li>
        </ol>
      </section>

      <footer><div className="footer-callout"><span>NEXT QUESTION?</span><p>새로운 문제를 발견하면<br />일단 작게 만들어봅니다.</p></div><div className="footer-bottom"><span>© 2026 ILLEJIVIN</span><a href="https://github.com/IlleJiViN" target="_blank" rel="noreferrer">GITHUB <Arrow /></a><a href="#top">BACK TO TOP ↑</a></div></footer>
    </main>
  );
}

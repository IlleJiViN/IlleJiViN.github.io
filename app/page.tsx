import { projects } from "./projects";
import Blog from "./blog/Blog";
import ThemeToggle from "./ThemeToggle";

const highlights = [
  {name: "비공개 보안 연구", text: "소프트웨어의 안전성을 분석하는 연구 프로젝트입니다.", tech: "세부 내용 비공개"},
  {name: "SpotSync", text: "장소 검색과 추천을 제공하는 팀 프로젝트입니다.", tech: "Python · React · PostgreSQL"},
  {name: "비공개 영상 프로젝트", text: "영상 제작 과정의 반복 작업을 줄이는 도구를 개발했습니다.", tech: "세부 내용 비공개"},
  {name: "에이전트 개발 도구", text: "Codex에서 Antigravity CLI로 작업을 위임하는 MCP 플러그인을 개발했습니다.", tech: "TypeScript · MCP · CLI"},
];


function Arrow() { return <span aria-hidden="true">↗</span>; }

export default function Home() {
  return (
    <main>
      <header className="site-header">
        <a className="brand" href="#top" aria-label="처음으로"><span className="brand-mark">IJ</span><span>ILLEJIVIN.LOG</span></a>
        <nav aria-label="주요 메뉴"><a href="#profile">소개</a><a href="#current">최근 작업</a><a href="/blog/">블로그</a></nav>
        <div className="header-actions"><ThemeToggle /><a className="github-link" href="https://github.com/IlleJiViN" target="_blank" rel="noreferrer">GitHub <Arrow /></a></div>
      </header>

      <section className="hero" id="top">
        <h1>프로젝트와 연구 기록</h1>
        <p className="hero-date">IlleJiViN · 2026.10</p>
      </section>

      <section className="section profile-section" id="profile">
        <div className="section-heading"><div><span className="section-number">INTRO</span><h2>What I build</h2></div><p>프로젝트와 연구, 작업 기록을 모았습니다.</p></div>
        <p className="profile-copy">AI 검색과 자동화 도구를 만들고, 컴퓨터 비전과 강화학습을 연구합니다. 일부 프로젝트는 개요만 공개합니다.</p>
        <div className="skill-list"><span>AI 모델·데이터 파이프라인</span><span>API·웹 인터페이스 연결</span><span>검색·RAG·자동화</span><span>실험 설계·평가·문서화</span></div>
        <div className="highlights">{highlights.map(item => <article key={item.name}><h3>{item.name}</h3><p>{item.text}</p><small>{item.tech}</small></article>)}</div>
        <p className="scope-note">비공개 프로젝트는 분야와 개요만 표시합니다.</p>
      </section>

      <section className="section current-section" id="current">
        <div className="section-heading"><div><span className="section-number">NOW</span><h2>Current work</h2></div><p>2026년 10월 기준 · 최근 구현과 진행 중인 연구</p></div>
        <div className="current-list">{projects.filter(item => item.year === "2026.10").map(item => <article key={item.name}><span className="project-status">{item.status}</span><h3>{item.name}</h3><p>{item.summary}</p>{item.href && <a href={item.href} target="_blank" rel="noreferrer">코드와 문서 ↗</a>}</article>)}</div>
      </section>



      <section className="manifesto" aria-label="개발 원칙"><p>MAKE THE SYSTEM</p><p>SHOW THE TRADE-OFFS</p><p>LEAVE A TRACE<span>.</span></p></section>

      <section className="section" id="notes">
        <div className="section-heading"><div><span className="section-number">02</span><h2>Blog</h2></div><p>프로젝트 설명, 작업 일기와 후기.</p></div>
        <Blog compact />
      </section>

      <footer><div className="footer-bottom"><span>© 2026 ILLEJIVIN</span><a href="https://github.com/IlleJiViN" target="_blank" rel="noreferrer">GITHUB <Arrow /></a><a href="#top">BACK TO TOP ↑</a></div></footer>
    </main>
  );
}

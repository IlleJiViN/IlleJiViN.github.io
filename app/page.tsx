const projects = [
  { year: "2026", name: "MalSight", type: "SECURITY · GRAPH ML", summary: "Windows PE를 정적 CFG로 바꾸고 GIN·JEPA·MIL과 설명 가능한 인터페이스를 연결한 악성코드 탐지 연구 MVP.", detail: "663D node features → 128D graph representation · CPU/CUDA · XAI", status: "PRIVATE RESEARCH" },
  { year: "2026", name: "SpotSync", type: "AI SEARCH · TEAM", summary: "여러 사람의 출발지를 기준으로 만날 장소를 찾는 서비스. 장소 데이터, 지리 검색, 의미 검색과 사용자 화면을 하나의 흐름으로 엮었다.", detail: "PostGIS · pgvector · BGE-M3 · NER · ColBERT · React", status: "CASE STUDY", href: "https://github.com/IlleJiViN/comp_team" },
  { year: "2026", name: "SemVid", type: "AI AUTOMATION · VIDEO", summary: "음악과 자막에서 어울리는 영상을 찾고 편집해 전달하는 트로트 MV 자동화 워크스테이션.", detail: "Whisper · Gemini · Vector search · FFmpeg · Telegram", status: "PRIVATE BUILD" },
  { year: "2026", name: "Antigravity Subagent", type: "OPEN SOURCE · DEV TOOL", summary: "Codex가 로컬 Antigravity CLI에 제한된 작업을 안전하게 위임할 수 있도록 만든 MCP 플러그인.", detail: "TypeScript · MCP · Codex Skill · CI · safety defaults", status: "OPEN SOURCE", href: "https://github.com/IlleJiViN/codex-antigravity-subagent" },
  { year: "2026", name: "Recycle Bin Browser", type: "WINDOWS · SYSTEM", summary: "Windows 휴지통 내부 구조를 직접 읽어 검색, 다중 복원, 백업과 CSV 내보내기를 제공하는 네이티브 도구.", detail: "C11 · Win32 API · bilingual UI · safe restore", status: "OPEN SOURCE", href: "https://github.com/IlleJiViN/recycle-bin-browser" },
  { year: "2025", name: "Cuuube", type: "ALGORITHM · VISUALIZATION", summary: "루빅스 큐브의 회전을 상태 변화로 모델링하고 A* 탐색과 3D 시각화로 확장한 알고리즘 실험.", detail: "Python · A* search · state modeling · Matplotlib", status: "OPEN SOURCE", href: "https://github.com/IlleJiViN/cuuube" },
];

const notes = [
  { date: "2026.09", title: "CFG 위에서 악성코드의 흔적을 읽는 법", text: "정확도 하나로 끝내지 않고, 모델이 본 명령어와 재구성 오차를 사람이 확인할 수 있는 분석 흐름으로 만들었다.", tags: ["MalSight", "XAI", "Research"] },
  { date: "2026.07", title: "장소 추천을 검색 시스템으로 다시 설계하기", text: "키워드 검색에서 출발해 위치, 개체명, 임베딩과 재순위를 결합했다. SpotSync 저장소 네 개가 남긴 선택과 실패를 한 이야기로 묶는다.", tags: ["SpotSync", "RAG", "PostGIS"] },
  { date: "2026.07", title: "반복 작업이 도구가 되는 순간", text: "뮤직비디오 파이프라인에서 반복되던 원격 GPU 제어를 fcolab이라는 작은 라이브러리로 분리했다.", tags: ["SemVid", "Automation", "Open Source"] },
  { date: "2024—2026", title: "Pygame에서 Godot까지", text: "적 AI와 충돌 처리부터 씬, 시그널과 셰이더까지. 게임을 만들며 코드의 구조를 배운 기록.", tags: ["Pygame", "Godot", "Growth"] },
];

function Arrow() { return <span aria-hidden="true">↗</span>; }

export default function Home() {
  return (
    <main>
      <header className="site-header">
        <a className="brand" href="#top" aria-label="처음으로"><span className="brand-mark">IJ</span><span>ILLEJIVIN.LOG</span></a>
        <nav aria-label="주요 메뉴"><a href="#projects">프로젝트</a><a href="#notes">기록</a><a href="#timeline">연혁</a></nav>
        <a className="github-link" href="https://github.com/IlleJiViN" target="_blank" rel="noreferrer">GitHub <Arrow /></a>
      </header>

      <section className="hero" id="top">
        <div className="hero-kicker"><span className="pulse" /> BUILDING IN PUBLIC · SEOUL</div>
        <h1>호기심을<br /><span>작동하는 것</span>으로.</h1>
        <div className="hero-bottom">
          <p>게임 로직에서 시작해 AI 검색, 자동화 도구와 보안 연구까지. 문제를 직접 쪼개고, 만들고, 검증한 과정을 기록합니다.</p>
          <div className="index-note"><span>INDEX / 34 REPOSITORIES</span><span>2023.11 — 2026.09</span></div>
        </div>
        <div className="hero-rule"><span>SCROLL TO EXPLORE</span></div>
      </section>

      <section className="section" id="projects">
        <div className="section-heading"><div><span className="section-number">01</span><h2>Selected work</h2></div><p>대표 프로젝트 6개. 비공개 연구는 코드 대신 문제와 검증 과정을 기록합니다.</p></div>
        <div className="project-grid">
          {projects.map((project, index) => {
            const content = <><div className="project-top"><span>{String(index + 1).padStart(2, "0")} / {project.year}</span><span className="project-status">{project.status}</span></div><div><p className="project-type">{project.type}</p><h3>{project.name}</h3><p className="project-summary">{project.summary}</p></div><div className="project-footer"><span>{project.detail}</span>{project.href && <span className="project-arrow"><Arrow /></span>}</div></>;
            return project.href ? <a className="project-card" href={project.href} target="_blank" rel="noreferrer" key={project.name}>{content}</a> : <article className="project-card" key={project.name}>{content}</article>;
          })}
        </div>
      </section>

      <section className="manifesto" aria-label="개발 원칙"><p>MAKE THE SYSTEM</p><p>SHOW THE TRADE-OFFS</p><p>LEAVE A TRACE<span>.</span></p></section>

      <section className="section" id="notes">
        <div className="section-heading"><div><span className="section-number">02</span><h2>Build notes</h2></div><p>결과보다 선택과 시행착오를 남기는 개발 기록.</p></div>
        <div className="notes-list">{notes.map((note, index) => <article className="note-row" key={note.title}><div className="note-index">N{String(index + 1).padStart(2, "0")}</div><time>{note.date}</time><div className="note-copy"><h3>{note.title}</h3><p>{note.text}</p><div className="tags">{note.tags.map((tag) => <span key={tag}>#{tag}</span>)}</div></div></article>)}</div>
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

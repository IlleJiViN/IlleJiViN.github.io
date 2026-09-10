const projects = [
  { year: "2023.11", name: "test", type: "FIRST REPOSITORY", summary: "GitHub 사용을 시작하며 만든 첫 저장소.", detail: "Empty repository", status: "ARCHIVE" },
  { year: "2024.09", name: "game-project", type: "GAME · START", summary: "게임 프로젝트를 시작하기 위해 만든 초기 저장소.", detail: "Empty repository", status: "ARCHIVE" },
  { year: "2024.09", name: "game", type: "GAME · NOTE", summary: "게임 개발을 시작하며 README와 저장소 흐름을 실험한 기록.", detail: "README · Git basics", status: "ARCHIVE" },
  { year: "2024.09—2025.04", name: "early-python-prototypes", type: "PYTHON · PROTOTYPES", summary: "Pygame 게임과 루빅스 큐브 회전·3D 시각화를 처음 시도한 초기 코드 모음.", detail: "Python · Pygame · cube rotation", status: "PRIVATE" },
  { year: "2024.09—11", name: "sw-game", type: "GAME · PYGAME", summary: "카메라, 적 추적 AI, 투사체, 충돌과 이펙트를 직접 구현한 액션 게임 프로토타입.", detail: "Python · Pygame · collision · AI", status: "PRIVATE" },
  { year: "2025.04—08", name: "cuuube", type: "ALGORITHM · VISUALIZATION", summary: "루빅스 큐브의 회전을 상태 변화로 모델링하고 A* 탐색과 3D 시각화로 확장한 실험.", detail: "Python · A* · Matplotlib", status: "OPEN SOURCE", href: "https://github.com/IlleJiViN/cuuube" },
  { year: "2025.07", name: "classify-on-chrome", type: "ML · BROWSER EXTENSION", summary: "RNN 뉴스 분류 모델을 Flask API와 Chrome 확장 프로그램으로 연결한 엔드투엔드 ML 프로토타입.", detail: "Keras · Flask · JavaScript · Chrome", status: "OPEN SOURCE", href: "https://github.com/IlleJiViN/classify-on-chrome" },
  { year: "2026.01", name: "Calculator", type: "JAVA · PARSER", summary: "문자열 수식과 연산 우선순위를 직접 처리하며 Java를 익힌 계산기 프로젝트.", detail: "Java · expression parsing", status: "PRIVATE" },
  { year: "2026.01", name: "godot_game", type: "GODOT · START", summary: "Godot 게임 개발을 시작하기 위해 만든 저장소.", detail: "Empty repository", status: "ARCHIVE" },
  { year: "2026.01", name: "godot_game_2d", type: "GODOT · START", summary: "2D 게임 프로젝트 구조를 만들며 남긴 초기 기록.", detail: "Initial setup", status: "ARCHIVE" },
  { year: "2026.01—02", name: "god_ot", type: "GAME · GODOT", summary: "씬, 시그널, 카메라, 파티클과 셰이더를 실험한 Godot 4 기반 2D 액션 프로토타입.", detail: "GDScript · GDShader · Godot 4", status: "PRIVATE" },
  { year: "2026.03—06", name: "teample", type: "AI SEARCH · TEAM", summary: "장소 수집·임베딩·공간 검색과 프론트엔드를 연결한 SpotSync의 초기 통합본.", detail: "Python · PostGIS · Elasticsearch", status: "PRIVATE" },
  { year: "2026.04", name: "crazy", type: "EXPERIMENT", summary: "아이디어를 빠르게 시작하기 위해 만든 실험 저장소.", detail: "Empty repository", status: "ARCHIVE" },
  { year: "2026.05—07", name: "comp_team / SpotSync", type: "AI SEARCH · TEAM", summary: "NER, 벡터 검색, 공간 데이터와 React UI를 결합한 다자간 장소 추천 서비스의 공개 개발본.", detail: "BGE-M3 · ONNX · pgvector · React", status: "OPEN SOURCE", href: "https://github.com/IlleJiViN/comp_team" },
  { year: "2026.06", name: "spotsync-contest", type: "TEAM · CONTEST", summary: "SpotSync 대회 작업을 위해 만든 저장소.", detail: "Empty repository", status: "ARCHIVE" },
  { year: "2026.06", name: "where2meet", type: "PRODUCT · COLLABORATION", summary: "SpotSync에 협업 방, UI/UX와 API 성능 개선을 더한 서비스 방향 실험.", detail: "Python · collaborative rooms", status: "PRIVATE" },
  { year: "2026.06", name: "genai_spotsync", type: "RAG · DATA PIPELINE", summary: "장소와 리뷰 데이터를 JSONL로 변환해 Vertex AI Search와 연결한 RAG 적재 실험.", detail: "PostgreSQL · JSONL · Vertex AI", status: "PRIVATE" },
  { year: "2026.07", name: "share", type: "AI · EDUCATION", summary: "사용자가 설명한 개념에서 이해, 누락과 오개념을 평가하고 개선 질문을 만드는 AI 학습 코치.", detail: "React · TypeScript · Gemini", status: "PRIVATE" },
  { year: "2026.07", name: "Fin-GNN-RAG", type: "FINANCE · GRAPH ML", summary: "금융 지식 그래프, 시계열 RAG와 ST-GAT을 결합한 주가 파급 예측 연구 프로토타입.", detail: "GAT · GRU · FastDTW · backtest", status: "PRIVATE RESEARCH" },
  { year: "2026.07", name: "spotsync-crawler", type: "AI SEARCH · RAG", summary: "NER, BGE-M3, ColBERT 재순위와 공간 검색을 결합하고 평가 케이스까지 확장한 SpotSync 통합본.", detail: "ColBERT · PostGIS · React · evaluation", status: "PRIVATE" },
  { year: "2026.07", name: "Trot_MV_Automation", type: "VIDEO · PROTOTYPE", summary: "자막을 기준으로 장면을 구성하는 트로트 뮤직비디오 자동화의 초기 웹 프로토타입.", detail: "Python · SRT · web UI", status: "PRIVATE" },
  { year: "2026.07", name: "semvid", type: "AI AUTOMATION · VIDEO", summary: "자막 보정, 영상 RAG 검색, FFmpeg 렌더링과 결과 전송을 연결한 MV 자동화 워크스테이션.", detail: "Whisper · Gemini · FFmpeg · Telegram", status: "PRIVATE" },
  { year: "2026.07", name: "gemini-brain-backup", type: "PERSONAL ARCHIVE", summary: "개발 과정의 대화와 작업 맥락을 보존하기 위한 개인 백업.", detail: "Private work log", status: "PRIVATE ONLY" },
  { year: "2026.07", name: "fcolab", type: "OPEN SOURCE · GPU TOOL", summary: "컨텍스트 관리자로 원격 Colab 작업과 세션 정리를 감싼 실험적 Python 패키지.", detail: "Python · context manager · Colab", status: "OPEN SOURCE", href: "https://github.com/IlleJiViN/fcolab" },
  { year: "2026.07", name: "drum_project", type: "COMPUTER VISION · MUSIC", summary: "손 추적과 가상 드럼스틱으로 킥, 스네어와 하이햇을 연주하는 에어 드럼 실험.", detail: "OpenCV · MediaPipe · audio", status: "OPEN SOURCE", href: "https://github.com/IlleJiViN/drum_project" },
  { year: "2026.07", name: "stock_exp", type: "AI · FINANCE UI", summary: "뉴스와 기술 지표를 여러 AI 역할로 해석하는 주식 분석 대시보드 콘셉트.", detail: "React · TypeScript · Gemini · RSS", status: "PRIVATE" },
  { year: "2026.07", name: "sunomidi", type: "MUSIC · AUTOMATION", summary: "오디오의 스템 분리와 MIDI 변환 작업을 구성하고 실행 스크립트를 생성하는 UI 프로토타입.", detail: "Demucs · Basic Pitch · React", status: "PRIVATE" },
  { year: "2026.07", name: "gpu-price-compare", type: "UTILITY · CRAWLER", summary: "여러 중고·쇼핑 플랫폼의 GPU 매물을 한 번에 검색하고 비교하는 웹 도구.", detail: "FastAPI · Python · JavaScript", status: "PRIVATE" },
  { year: "2026.07", name: "recycle-bin-browser", type: "WINDOWS · SYSTEM", summary: "Windows 휴지통 메타데이터를 읽어 검색, 복원, 백업과 CSV 내보내기를 제공하는 네이티브 도구.", detail: "C11 · Win32 API · safe restore", status: "OPEN SOURCE", href: "https://github.com/IlleJiViN/recycle-bin-browser" },
  { year: "2026.08", name: "codex-antigravity-subagent", type: "OPEN SOURCE · DEV TOOL", summary: "Codex가 로컬 Antigravity CLI에 제한된 작업을 안전하게 위임하도록 만든 MCP 플러그인.", detail: "TypeScript · MCP · Codex Skill · CI", status: "OPEN SOURCE", href: "https://github.com/IlleJiViN/codex-antigravity-subagent" },
  { year: "2026.08", name: "mission", type: "LEARNING · DEV ENV", summary: "터미널, 권한, Git/GitHub, Docker, Compose와 Nginx를 직접 다룬 개발 환경 실습 기록.", detail: "Docker · Git · Nginx · macOS", status: "OPEN SOURCE", href: "https://github.com/IlleJiViN/mission" },
  { year: "2026.08", name: "mission1", type: "LEARNING · PYTHON", summary: "JSON 영속화, 문제 CRUD, 복구와 안전 종료를 갖춘 객체지향 콘솔 퀴즈 게임.", detail: "Python · OOP · JSON · recovery", status: "OPEN SOURCE", href: "https://github.com/IlleJiViN/mission1" },
  { year: "2026.08", name: "mission2", type: "LEARNING · NPU", summary: "외부 수치 라이브러리 없이 MAC 연산, 패턴 판별과 메모리 접근 성능을 비교한 NPU 시뮬레이터.", detail: "Python · MAC · benchmark · validation", status: "OPEN SOURCE", href: "https://github.com/IlleJiViN/mission2" },
  { year: "2026.08—09", name: "MalSight", type: "SECURITY · GRAPH ML", summary: "Windows PE를 정적 CFG로 바꾸고 GIN·JEPA·MIL과 설명 가능한 인터페이스를 연결한 악성코드 탐지 연구 MVP.", detail: "663D → 128D · CPU/CUDA · XAI", status: "PRIVATE RESEARCH" },
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
        <div className="section-heading"><div><span className="section-number">01</span><h2>All work</h2></div><p>34개 저장소를 첫 기록부터 최신 연구까지 한 줄로 연결했습니다. 공개 프로젝트는 카드를 눌러 코드를 볼 수 있습니다.</p></div>
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

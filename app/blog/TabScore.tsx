import { DRUM_INSTRUMENTS, type TabBeat, type TabScoreData } from './tabScore.mjs';

const STAFF_LINES = [0, 2, 4, 6, 8];

const RHYTHMS: Record<TabBeat['duration'], { label: string; rest: string }> = {
  1: { label: '온', rest: '𝄻' },
  2: { label: '2분', rest: '𝄼' },
  4: { label: '4분', rest: '𝄽' },
  8: { label: '8분', rest: '𝄾' },
  16: { label: '16분', rest: '𝄿' },
};

type TabScoreProps = {
  score: TabScoreData | null;
  difficulty?: number | null;
  mood?: string;
  compact?: boolean;
};

function StaffRules() {
  return (
    <>
      {STAFF_LINES.map(step => <i className="drum-staff-line" data-step={step} aria-hidden="true" key={step} />)}
      <i className="drum-clef" aria-hidden="true" />
    </>
  );
}

export function DrumStaffStamp({ chapter }: { chapter: number }) {
  return (
    <i className="drum-stamp" aria-hidden="true">
      <i className="drum-stamp-staff"><StaffRules /></i>
      {chapter > 0 && <b className="drum-stamp-index">{String(chapter).padStart(2, '0')}</b>}
    </i>
  );
}

function ScoreBeat({ beat, position }: { beat: TabBeat; position: number }) {
  const hits = DRUM_INSTRUMENTS.filter(instrument => beat.notes.includes(instrument.id));
  const rhythm = RHYTHMS[beat.duration];
  const rest = hits.length === 0;
  const high = hits[0];
  const low = hits[hits.length - 1];

  return (
    <li className="drum-beat" data-duration={beat.duration}>
      <b className="drum-reading">
        {position}번째, {rhythm.label}{rest ? '쉼표' : `음표: ${hits.map(hit => hit.label).join(', ')}`}
      </b>
      {rest ? (
        <i className="drum-rest" aria-hidden="true">{rhythm.rest}</i>
      ) : (
        <>
          {high.step < -1 && <i className="drum-ledger" data-step={high.step} aria-hidden="true" />}
          {beat.duration !== 1 && <i className="drum-stem" data-step={high.step} data-base={low.step} aria-hidden="true" />}
          {hits.map(hit => <i
            className="drum-head"
            data-step={hit.step}
            data-shape={hit.head}
            title={hit.label}
            aria-hidden="true"
            key={hit.id}
          />)}
        </>
      )}
    </li>
  );
}

export default function TabScore({ score, difficulty, mood, compact = false }: TabScoreProps) {
  const measures = score?.measures ?? [];
  if (!measures.length && !difficulty && !mood) return null;

  return (
    <figure className={compact ? 'authored-tab authored-tab-compact' : 'authored-tab'}>
      {(mood || difficulty) && <figcaption className="authored-tab-markings">
        {mood && <p className="authored-tab-mood"><small>기분</small> <em>{mood}</em></p>}
        {difficulty && <p className="authored-tab-difficulty"><small>난이도</small> <strong>{difficulty}/5</strong></p>}
      </figcaption>}
      {measures.length > 0 && <section className="authored-tab-scroller" tabIndex={0} aria-label="드럼 악보">
        <section className="drum-staff" aria-label="마디 목록">
          <StaffRules />
          <ol className="drum-measures" role="list">
            {measures.map((measure, index) => (
              <li className="drum-measure" key={index}>
                <ol className="drum-voice" role="list" aria-label={`${index + 1}마디`}>
                  {measure.map((beat, position) => <ScoreBeat beat={beat} position={position + 1} key={position} />)}
                </ol>
              </li>
            ))}
          </ol>
        </section>
      </section>}
    </figure>
  );
}

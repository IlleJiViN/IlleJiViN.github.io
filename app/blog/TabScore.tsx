import type { TabBeat, TabScoreData, TabString } from './tabScore.mjs';

const STRINGS: { name: TabString; label: string }[] = [
  { name: 'e', label: '1번 줄, 높은 미' },
  { name: 'B', label: '2번 줄, 시' },
  { name: 'G', label: '3번 줄, 솔' },
  { name: 'D', label: '4번 줄, 레' },
  { name: 'A', label: '5번 줄, 라' },
  { name: 'E', label: '6번 줄, 낮은 미' },
];

const RHYTHMS: Record<TabBeat['duration'], { label: string; note: string; rest: string }> = {
  1: { label: '온', note: '𝅝', rest: '𝄻' },
  2: { label: '2분', note: '𝅗𝅥', rest: '𝄼' },
  4: { label: '4분', note: '♩', rest: '𝄽' },
  8: { label: '8분', note: '♪', rest: '𝄾' },
  16: { label: '16분', note: '𝅘𝅥𝅯', rest: '𝄿' },
};

type TabScoreProps = {
  score: TabScoreData | null;
  difficulty?: number | null;
  mood?: string;
  compact?: boolean;
};

export default function TabScore({ score, difficulty, mood, compact = false }: TabScoreProps) {
  const columns = score?.measures.flatMap((measure, bar) => measure.map((beat, index) => ({
    beat,
    number: index + 1,
    measure: bar + 1,
    startsMeasure: index === 0,
  }))) ?? [];

  if (!columns.length && !difficulty && !mood) return null;

  return (
    <figure className={compact ? 'authored-tab authored-tab-compact' : 'authored-tab'}>
      {(mood || difficulty) && <figcaption className="authored-tab-markings">
        {mood && <p className="authored-tab-mood"><span>기분</span> <em>{mood}</em></p>}
        {difficulty && <p className="authored-tab-difficulty"><span>난이도</span> <strong>{difficulty}/5</strong></p>}
      </figcaption>}
      {columns.length > 0 && <section className="authored-tab-scroller" tabIndex={0} aria-label="기타 TAB 악보, 좌우로 스크롤">
        <table className="authored-tab-staff" aria-label="기타 타브 악보">
          <thead>
            <tr>
              <th className="authored-tab-tuning authored-tab-clef" scope="col" aria-label="기타 줄">TAB</th>
              {columns.map(({ beat, measure, number }) => {
                const rhythm = RHYTHMS[beat.duration];
                const rest = !Object.keys(beat.notes).length;
                return <th className="authored-tab-rhythm" scope="col" key={`${measure}-${number}`} aria-label={`${measure}마디 ${number}번째, ${rhythm.label}${rest ? '쉼표' : '음표'}`}>
                  <span aria-hidden="true">{rest ? rhythm.rest : rhythm.note}</span>
                </th>;
              })}
            </tr>
          </thead>
          <tbody>
            {STRINGS.map(({ name, label }) => (
              <tr key={name}>
                <th className="authored-tab-tuning" scope="row" aria-label={label}>{name}</th>
                {columns.map(({ beat, measure, number, startsMeasure }) => {
                  const fret = beat.notes[name];
                  return <td className="authored-tab-beat" data-measure-start={startsMeasure || undefined} key={`${measure}-${number}`}>
                    {fret !== undefined && <strong className="authored-tab-fret">{fret}</strong>}
                  </td>;
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </section>}
    </figure>
  );
}

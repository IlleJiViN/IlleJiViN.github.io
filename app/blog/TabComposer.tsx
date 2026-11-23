'use client';

import { useId, useRef, useState } from 'react';
import { Button } from '@astryxdesign/core/Button';
import TabScore from './TabScore';
import {
  parseTabScore,
  TAB_BEAT_MAX,
  TAB_DURATIONS,
  TAB_FRET_MAX,
  TAB_MEASURE_MAX,
  TAB_MOOD_MAX,
  TAB_STRINGS,
  type TabDuration,
  type TabScoreData,
  type TabString,
} from './tabScore.mjs';

const DURATION_LABELS: Record<TabDuration, string> = {
  1: '온음표',
  2: '2분음표',
  4: '4분음표',
  8: '8분음표',
  16: '16분음표',
};

type TabComposerProps = {
  initialScore?: TabScoreData | null;
  initialDifficulty?: number | null;
  initialMood?: string;
  issueUrl: string;
  isExisting?: boolean;
};

function formatScore(score: TabScoreData | null | undefined) {
  return score?.measures.map(measure => measure.map(beat => {
    const notes = TAB_STRINGS.flatMap(string => beat.notes[string] === undefined ? [] : [`${string}${beat.notes[string]}`]);
    return `${beat.duration}:${notes.join('+') || 'r'}`;
  }).join(' ')).join(' |\n') ?? '';
}

function validFret(fret: string) {
  return fret === '' || (/^\d{1,2}$/.test(fret) && Number(fret) <= TAB_FRET_MAX);
}

export default function TabComposer({
  initialScore,
  initialDifficulty,
  initialMood,
  issueUrl,
  isExisting = false,
}: TabComposerProps) {
  const id = useId();
  const [source, setSource] = useState(() => formatScore(initialScore));
  const [difficultyValue, setDifficultyValue] = useState(initialDifficulty?.toString() ?? '');
  const [moodValue, setMoodValue] = useState(initialMood ?? '');
  const [duration, setDuration] = useState<TabDuration>(4);
  const [frets, setFrets] = useState<Partial<Record<TabString, string>>>({});
  const [pendingBar, setPendingBar] = useState(false);
  const [copyStatus, setCopyStatus] = useState('');
  const exportDetails = useRef<HTMLDetailsElement>(null);
  const exportField = useRef<HTMLTextAreaElement>(null);

  const score = parseTabScore(source);
  const invalidScore = Boolean(source.trim() && !score);
  const measureCount = score?.measures.length ?? 0;
  const lastMeasureSize = score?.measures[measureCount - 1]?.length ?? 0;
  const canAddBeat = !invalidScore && (pendingBar ? measureCount < TAB_MEASURE_MAX : lastMeasureSize < TAB_BEAT_MAX);
  const canAddBar = Boolean(score && !pendingBar && measureCount < TAB_MEASURE_MAX);
  const fretValues = TAB_STRINGS.map(string => frets[string] ?? '');
  const canAddNote = canAddBeat && fretValues.some(fret => fret !== '') && fretValues.every(validFret);
  const difficulty = difficultyValue ? Number(difficultyValue) : null;
  const mood = moodValue.trim().replace(/\s+/g, ' ');
  const formattedScore = formatScore(score);
  const markdown = `### TAB 난이도\n\n${difficulty ?? ''}\n\n### TAB 기분\n\n${mood}\n\n### TAB 악보\n\n${formattedScore}`;
  const exportText = isExisting ? markdown : formattedScore;
  const canCopy = !invalidScore && (isExisting || Boolean(score));

  function updateSource(value: string) {
    setSource(value);
    setPendingBar(false);
    setCopyStatus('');
  }

  function addBeat(rest: boolean) {
    if (!canAddBeat || (!rest && !canAddNote)) return;
    const notes = rest ? 'r' : TAB_STRINGS.flatMap((string, index) => {
      const fret = fretValues[index];
      return fret === '' ? [] : [`${string}${Number(fret)}`];
    }).join('+');
    const separator = pendingBar ? ' |\n' : formattedScore ? ' ' : '';
    updateSource(`${formattedScore}${separator}${duration}:${notes}`);
    setFrets({});
  }

  async function copyScore() {
    if (!canCopy) return;
    try {
      await navigator.clipboard.writeText(exportText);
      setCopyStatus('복사했어요.');
    } catch {
      if (exportDetails.current) exportDetails.current.open = true;
      exportField.current?.focus();
      exportField.current?.select();
      setCopyStatus('선택한 내용을 직접 복사하세요.');
    }
  }

  return (
    <section className="tab-composer" aria-labelledby={`${id}-title`}>
      <header className="tab-composer-heading">
        <h1 id={`${id}-title`}>TAB 쓰기</h1>
      </header>
      <section className="tab-composer-layout" aria-label="악보 작업 공간">
        <section className="tab-composer-editor" aria-label="악보 입력">
          <section className="tab-composer-meta" aria-label="악보 메모">
            <label>
              난이도
              <select value={difficultyValue} onChange={event => { setDifficultyValue(event.target.value); setCopyStatus(''); }}>
                <option value="">선택 안 함</option>
                {[1, 2, 3, 4, 5].map(value => <option key={value} value={value}>{value} / 5</option>)}
              </select>
            </label>
            <label>
              그날의 기분
              <input
                maxLength={TAB_MOOD_MAX}
                value={moodValue}
                onChange={event => { setMoodValue(event.target.value); setCopyStatus(''); }}
              />
            </label>
          </section>
          <fieldset className="tab-composer-notes">
            <legend>음표 입력</legend>
            <p id={`${id}-frets`}>프렛은 0부터 {TAB_FRET_MAX}까지예요. 0은 개방현, 여러 줄에 숫자를 적으면 함께 연주하는 음이 돼요.</p>
            <section className="tab-composer-frets" aria-label="기타 여섯 줄">
              {TAB_STRINGS.map((string, index) => (
                <label key={string}>
                  <b aria-hidden="true">{string}</b>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={2}
                    aria-label={`${index + 1}번 줄 ${string} 프렛`}
                    aria-describedby={`${id}-frets`}
                    aria-invalid={!validFret(frets[string] ?? '')}
                    value={frets[string] ?? ''}
                    onChange={event => setFrets(previous => ({ ...previous, [string]: event.target.value }))}
                  />
                </label>
              ))}
            </section>
            <section className="tab-composer-beat" aria-label="음 길이와 추가">
              <label>
                음 길이
                <select value={duration} onChange={event => setDuration(Number(event.target.value) as TabDuration)}>
                  {TAB_DURATIONS.map(value => <option key={value} value={value}>{DURATION_LABELS[value]}</option>)}
                </select>
              </label>
              <Button label="음표 추가" size="sm" isDisabled={!canAddNote} onClick={() => addBeat(false)} />
              <Button label="쉼표 추가" size="sm" variant="ghost" isDisabled={!canAddBeat} onClick={() => addBeat(true)} />
              <Button label="다음 마디" size="sm" variant="ghost" isDisabled={!canAddBar} onClick={() => setPendingBar(true)} />
            </section>
            <p className="tab-composer-measure" aria-live="polite">
              {pendingBar ? measureCount + 1 : Math.max(1, measureCount)}마디 · {pendingBar ? 0 : lastMeasureSize}음
            </p>
          </fieldset>
          <details className="tab-composer-details">
            <summary>악보 코드 직접 편집</summary>
            <label>
              TAB 악보
              <textarea
                rows={4}
                maxLength={8192}
                value={source}
                aria-invalid={invalidScore}
                aria-describedby={`${id}-format`}
                onChange={event => updateSource(event.target.value)}
                spellCheck={false}
              />
            </label>
            <p id={`${id}-format`}>
              음 길이와 프렛을 콜론으로 연결해요. <code>4:E0 8:A2+D2 8:r | 4:e3</code>
            </p>
          </details>
          {invalidScore && <p className="tab-composer-feedback" role="status">악보 코드의 음 길이, 프렛과 마디를 확인하세요. 최대 {TAB_MEASURE_MAX}마디, 한 마디에 최대 {TAB_BEAT_MAX}음까지 넣을 수 있어요.</p>}
        </section>
        <figure className="tab-composer-preview">
          <figcaption>미리보기</figcaption>
          {score || difficulty || mood ? <TabScore score={score} difficulty={difficulty} mood={mood} /> : <p>음표나 쉼표를 추가하면 악보가 보여요.</p>}
        </figure>
      </section>
      <footer className="tab-composer-export">
        <p>{isExisting
          ? 'GitHub 글의 ⋯ 메뉴에서 Edit를 누르세요. 기존 TAB 항목을 교체하거나, 처음이라면 본문 끝에 붙여넣으세요.'
          : 'GitHub 글 양식의 ‘TAB 악보’에 붙여넣고 ‘TAB 난이도’, ‘TAB 기분’을 입력하세요.'}</p>
        <section className="tab-composer-actions" aria-label="GitHub에 붙여넣기">
          <Button label={isExisting ? 'TAB 항목 복사' : 'TAB 악보 복사'} variant="primary" size="sm" isDisabled={!canCopy} onClick={copyScore} />
          <Button label={isExisting ? 'GitHub에서 글 열기' : 'GitHub 글 양식 열기'} href={issueUrl} target="_blank" rel="noreferrer" size="sm" />
          <output className="tab-composer-feedback" aria-live="polite">{copyStatus}</output>
        </section>
        {canCopy && <details className="tab-composer-details" ref={exportDetails}>
          <summary>복사할 내용 보기</summary>
          <label>
            붙여넣을 내용
            <textarea rows={isExisting ? 9 : 4} value={exportText} readOnly ref={exportField} />
          </label>
        </details>}
      </footer>
    </section>
  );
}

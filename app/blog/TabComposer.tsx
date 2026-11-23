'use client';

import { useId, useRef, useState } from 'react';
import { Button } from '@astryxdesign/core/Button';
import { ToggleButton, ToggleButtonGroup } from '@astryxdesign/core/ToggleButton';
import TabScore from './TabScore';
import {
  DRUM_INSTRUMENTS,
  parseTabScore,
  TAB_BEAT_MAX,
  TAB_DURATIONS,
  TAB_MEASURE_MAX,
  TAB_MOOD_MAX,
  type TabDuration,
  type TabScoreData,
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
  return score?.measures.map(measure => measure.map(beat =>
    `${beat.duration}:${beat.notes.join('+') || 'r'}`,
  ).join(' ')).join(' |\n') ?? '';
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
  const [instruments, setInstruments] = useState<string[]>([]);
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
  const canAddNote = canAddBeat && instruments.length > 0;
  const difficulty = difficultyValue ? Number(difficultyValue) : null;
  const mood = moodValue.trim().replace(/\s+/g, ' ');
  const formattedScore = formatScore(score);
  const markdown = `### 드럼 난이도\n\n${difficulty ?? ''}\n\n### 드럼 기분\n\n${mood}\n\n### 드럼 악보\n\n${formattedScore}`;
  const exportText = isExisting ? markdown : formattedScore;
  const canCopy = !invalidScore && (isExisting || Boolean(score));

  function updateSource(value: string) {
    setSource(value);
    setPendingBar(false);
    setCopyStatus('');
  }

  function addBeat(rest: boolean) {
    if (!canAddBeat || (!rest && !canAddNote)) return;
    const notes = rest ? 'r' : DRUM_INSTRUMENTS
      .filter(({ id }) => instruments.includes(id))
      .map(({ id }) => id)
      .join('+');
    const separator = pendingBar ? ' |\n' : formattedScore ? ' ' : '';
    updateSource(`${formattedScore}${separator}${duration}:${notes}`);
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
        <h1 id={`${id}-title`}>드럼 악보 쓰기</h1>
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
            <p id={`${id}-instruments`}>함께 칠 악기를 고르고 음표를 추가하세요.</p>
            <ToggleButtonGroup
              label="드럼 악기"
              aria-describedby={`${id}-instruments`}
              className="tab-composer-instruments"
              type="multiple"
              size="sm"
              value={instruments}
              onChange={setInstruments}
            >
              {DRUM_INSTRUMENTS.map(({ id, label }) => (
                <ToggleButton key={id} label={label} value={id} />
              ))}
            </ToggleButtonGroup>
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
              {pendingBar ? measureCount + 1 : Math.max(1, measureCount)}마디 · {pendingBar ? 0 : lastMeasureSize}개 입력
            </p>
          </fieldset>
          <details className="tab-composer-details">
            <summary>악보 코드 직접 편집</summary>
            <label>
              드럼 악보
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
              음 길이 뒤에 악기 코드를 적어요. <code>8:HH+BD 8:HH 4:HH+SD 4:r | 4:CR+BD</code>
            </p>
            <p>{DRUM_INSTRUMENTS.map(({ id, label }) => `${id} ${label}`).join(' · ')}</p>
          </details>
          {invalidScore && <p className="tab-composer-feedback" role="status">음 길이, 악기 코드와 마디를 확인하세요. 최대 {TAB_MEASURE_MAX}마디, 한 마디에 최대 {TAB_BEAT_MAX}개까지 입력할 수 있어요.</p>}
        </section>
        <figure className="tab-composer-preview">
          <figcaption>미리보기</figcaption>
          {score || difficulty || mood ? <TabScore score={score} difficulty={difficulty} mood={mood} /> : <p>음표나 쉼표를 추가하면 악보가 보여요.</p>}
        </figure>
      </section>
      <footer className="tab-composer-export">
        <p>{isExisting
          ? 'GitHub 글의 ⋯ 메뉴에서 Edit를 누르세요. 기존 드럼 항목을 교체하거나, 처음이라면 본문 끝에 붙여넣으세요.'
          : 'GitHub 글 양식의 ‘드럼 악보’에 붙여넣고 ‘드럼 난이도’와 ‘드럼 기분’을 입력하세요.'}</p>
        <section className="tab-composer-actions" aria-label="GitHub에 붙여넣기">
          <Button label={isExisting ? '드럼 항목 복사' : '드럼 악보 복사'} variant="primary" size="sm" isDisabled={!canCopy} onClick={copyScore} />
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

'use client';

import { useId, useRef, useState } from 'react';
import { Button } from '@astryxdesign/core/Button';
import { ToggleButton, ToggleButtonGroup } from '@astryxdesign/core/ToggleButton';
import TabScore from './TabScore';
import {
  DRUM_INSTRUMENTS,
  formatTabScore,
  parseTabScore,
  TAB_BEAT_MAX,
  TAB_DURATIONS,
  TAB_MEASURE_MAX,
  TAB_MOOD_MAX,
  TAB_SOURCE_MAX,
  TAB_TUPLET_MAX,
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

const TUPLET_PRESETS = {
  triplet: { count: 3, inTimeOf: 2 },
  sextuplet: { count: 6, inTimeOf: 4 },
};
type Grouping = 'straight' | 'custom' | keyof typeof TUPLET_PRESETS;

type TabComposerProps = {
  initialScore?: TabScoreData | null;
  initialDifficulty?: number | null;
  initialMood?: string;
  issueUrl: string;
  isExisting?: boolean;
};

function ratioPart(value: string, min: number) {
  const number = Number(value);
  return /^\d+$/.test(value) && number >= min && number <= TAB_TUPLET_MAX ? number : null;
}

export default function TabComposer({
  initialScore,
  initialDifficulty,
  initialMood,
  issueUrl,
  isExisting = false,
}: TabComposerProps) {
  const id = useId();
  const [source, setSource] = useState(() => formatTabScore(initialScore));
  const [difficultyValue, setDifficultyValue] = useState(initialDifficulty?.toString() ?? '');
  const [moodValue, setMoodValue] = useState(initialMood ?? '');
  const [duration, setDuration] = useState<TabDuration>(4);
  const [grouping, setGrouping] = useState<Grouping>('straight');
  const [customCount, setCustomCount] = useState('5');
  const [customInTimeOf, setCustomInTimeOf] = useState('4');
  const [draftNotes, setDraftNotes] = useState<string[]>([]);
  const [instruments, setInstruments] = useState<string[]>([]);
  const [pendingBar, setPendingBar] = useState(false);
  const [copyStatus, setCopyStatus] = useState('');
  const exportDetails = useRef<HTMLDetailsElement>(null);
  const exportField = useRef<HTMLTextAreaElement>(null);

  const score = parseTabScore(source);
  const invalidScore = Boolean(source.trim() && !score);
  const measureCount = score?.measures.length ?? 0;
  const lastMeasureSize = score?.measures[measureCount - 1]?.length ?? 0;
  const count = ratioPart(customCount, 2);
  const inTimeOf = ratioPart(customInTimeOf, 1);
  const customRatio = count !== null && inTimeOf !== null && count !== inTimeOf ? { count, inTimeOf } : null;
  const tuplet = grouping === 'custom' ? customRatio : grouping === 'straight' ? null : TUPLET_PRESETS[grouping];
  const invalidRatio = grouping === 'custom' && !tuplet;
  const hasDraft = draftNotes.length > 0;
  const occupied = pendingBar ? 0 : lastMeasureSize;
  const hasRoom = occupied + (tuplet?.count ?? 1) <= TAB_BEAT_MAX;
  const canAddBeat = !invalidScore && !invalidRatio && hasRoom && (!pendingBar || measureCount < TAB_MEASURE_MAX);
  const canAddBar = Boolean(score && !hasDraft && !pendingBar && measureCount < TAB_MEASURE_MAX);
  const canAddNote = canAddBeat && instruments.length > 0;
  const difficulty = difficultyValue ? Number(difficultyValue) : null;
  const mood = moodValue.trim().replace(/\s+/g, ' ');
  const formattedScore = formatTabScore(score);
  const separator = pendingBar ? ' |\n' : formattedScore ? ' ' : '';
  const previewScore = hasDraft ? parseTabScore(`${formattedScore}${separator}${draftNotes.join(' ')}`) : score;
  const markdown = `### 드럼 난이도\n\n${difficulty ?? ''}\n\n### 드럼 기분\n\n${mood}\n\n### 드럼 악보\n\n${formattedScore}`;
  const exportText = isExisting ? markdown : formattedScore;
  const canCopy = !invalidScore && !hasDraft && (isExisting || Boolean(score));

  function updateSource(value: string) {
    setSource(value);
    setDraftNotes([]);
    setPendingBar(false);
    setCopyStatus('');
  }

  function addBeat(rest: boolean) {
    if (!canAddBeat || (!rest && !canAddNote)) return;
    const notes = rest ? 'r' : DRUM_INSTRUMENTS
      .filter(({ id }) => instruments.includes(id))
      .map(({ id }) => id)
      .join('+');
    const beat = `${duration}:${notes}`;
    if (!tuplet) {
      updateSource(`${formattedScore}${separator}${beat}`);
      return;
    }
    const beats = [...draftNotes, beat];
    if (beats.length === tuplet.count) {
      updateSource(`${formattedScore}${separator}${tuplet.count}:${tuplet.inTimeOf}[${beats.join(' ')}]`);
    } else {
      setDraftNotes(beats);
      setCopyStatus('');
    }
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
            <section className="tab-composer-rhythm" aria-label="리듬 설정">
              <label>
                음 길이
                <select disabled={hasDraft} value={duration} onChange={event => setDuration(Number(event.target.value) as TabDuration)}>
                  {TAB_DURATIONS.map(value => <option key={value} value={value}>{DURATION_LABELS[value]}</option>)}
                </select>
              </label>
              <label>
                리듬 묶음
                <select disabled={hasDraft} value={grouping} onChange={event => setGrouping(event.target.value as Grouping)}>
                  <option value="straight">일반</option>
                  <option value="triplet">3연음 (3:2)</option>
                  <option value="sextuplet">6연음 (6:4)</option>
                  <option value="custom">직접 비율 입력</option>
                </select>
              </label>
            </section>
            {grouping === 'custom' && (
              <section className="tab-composer-ratio" aria-label="연음 비율">
                <label>
                  넣을 음 수
                  <input type="number" min={2} max={TAB_TUPLET_MAX} step={1} disabled={hasDraft}
                    value={customCount} onChange={event => setCustomCount(event.target.value)}
                    aria-invalid={invalidRatio} aria-describedby={invalidRatio ? `${id}-ratio` : undefined} />
                </label>
                <label>
                  기준 음 수
                  <input type="number" min={1} max={TAB_TUPLET_MAX} step={1} disabled={hasDraft}
                    value={customInTimeOf} onChange={event => setCustomInTimeOf(event.target.value)}
                    aria-invalid={invalidRatio} aria-describedby={invalidRatio ? `${id}-ratio` : undefined} />
                </label>
              </section>
            )}
            <section className="tab-composer-beat" aria-label="악보에 추가">
              <Button label="음표 추가" size="sm" isDisabled={!canAddNote} onClick={() => addBeat(false)} />
              <Button label="쉼표 추가" size="sm" variant="ghost" isDisabled={!canAddBeat} onClick={() => addBeat(true)} />
              <Button label="다음 마디" size="sm" variant="ghost" isDisabled={!canAddBar} onClick={() => setPendingBar(true)} />
              {hasDraft && <Button label="묶음 취소" size="sm" variant="ghost" onClick={() => setDraftNotes([])} />}
            </section>
            {invalidRatio && <p className="tab-composer-measure" id={`${id}-ratio`} role="status">넣을 음 수는 2–{TAB_TUPLET_MAX}, 기준 음 수는 1–{TAB_TUPLET_MAX} 사이로 서로 다르게 입력하세요.</p>}
            {!hasRoom && <p className="tab-composer-measure" role="status">{canAddBar ? '이 마디에 들어갈 자리가 부족해요. 다음 마디에 넣으세요.' : '이 마디에 더 넣을 자리가 없어요.'}</p>}
            {tuplet && <p className="tab-composer-measure" aria-live="polite">
              {hasDraft
                ? `${tuplet.count}:${tuplet.inTimeOf} 묶음 · ${draftNotes.length}/${tuplet.count} 입력`
                : `${DURATION_LABELS[duration]} ${tuplet.inTimeOf}개 길이에 ${tuplet.count}개를 넣어요.`}
            </p>}
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
                maxLength={TAB_SOURCE_MAX}
                value={source}
                disabled={hasDraft}
                aria-invalid={invalidScore}
                aria-describedby={`${id}-format`}
                onChange={event => updateSource(event.target.value)}
                spellCheck={false}
              />
            </label>
            <p id={`${id}-format`}>
              음 길이 뒤에 악기 코드를 적어요. <code>8:HH+BD 8:HH 4:HH+SD 4:r | 4:CR+BD</code>
            </p>
            <p>연음은 비율 뒤에 대괄호로 묶어요. 길이가 다른 음표도 조합할 수 있어요. <code>3:2[8:HH 16:SD]</code></p>
            <p>{DRUM_INSTRUMENTS.map(({ id, label }) => `${id} ${label}`).join(' · ')}</p>
          </details>
          {invalidScore && <p className="tab-composer-feedback" role="status">음 길이, 악기 코드와 마디를 확인하세요. 최대 {TAB_MEASURE_MAX}마디, 한 마디에 최대 {TAB_BEAT_MAX}개까지 입력할 수 있어요.</p>}
        </section>
        <figure className="tab-composer-preview">
          <figcaption>미리보기</figcaption>
          {previewScore || difficulty || mood ? <TabScore score={previewScore} difficulty={difficulty} mood={mood} /> : <p>음표나 쉼표를 추가하면 악보가 보여요.</p>}
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

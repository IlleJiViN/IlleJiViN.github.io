'use client';

import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react';
import { Button } from '@astryxdesign/core/Button';
import TabScore from './TabScore';
import { createDrumAudio, type DrumAudio } from './drumAudio';
import {
  DRUM_RECORD_BPM_MAX,
  DRUM_RECORD_BPM_MIN,
  quantizeDrumTake,
  type DrumRecordingConfig,
  type DrumRecordingHit,
  type DrumRecordGrid,
} from './drumRecording.mjs';
import { TAB_MEASURE_MAX, type DrumInstrument, type TabScoreData } from './tabScore.mjs';

const PADS = [
  { code: 'KeyA', key: 'A', instrument: 'BD', label: '킥' },
  { code: 'KeyS', key: 'S', instrument: 'SD', label: '스네어' },
  { code: 'KeyD', key: 'D', instrument: 'FT', label: '플로어 탐' },
  { code: 'KeyF', key: 'F', instrument: 'MT', label: '미드 탐' },
  { code: 'KeyJ', key: 'J', instrument: 'HH', label: '하이햇' },
  { code: 'KeyK', key: 'K', instrument: 'RD', label: '라이드' },
  { code: 'KeyL', key: 'L', instrument: 'HT', label: '하이 탐' },
  { code: 'Semicolon', key: ';', instrument: 'CR', label: '크래시' },
] as const;
const GRIDS = [['8', '8분음표'], ['16', '16분음표'], ['3', '3연음'], ['6', '6연음']] as const;
const BEATS_PER_BAR = 4;
const AUDIO_START_LIMIT_MS = 500;

type Take = DrumRecordingConfig & {
  start: number;
  hits: DrumRecordingHit[];
};
type Phase = 'idle' | 'starting' | 'countdown' | 'recording';

type DrumRecorderProps = {
  maxBars: number;
  disabled?: boolean;
  onInsert: (score: TabScoreData) => boolean;
};

async function startAudio(audio: DrumAudio) {
  let timeout: number | undefined;
  try {
    return await Promise.race([
      audio.resume().then(() => true),
      new Promise<boolean>(resolve => { timeout = window.setTimeout(() => resolve(false), AUDIO_START_LIMIT_MS); }),
    ]);
  } catch {
    return false;
  } finally {
    window.clearTimeout(timeout);
  }
}

export default function DrumRecorder({ maxBars, disabled = false, onInsert }: DrumRecorderProps) {
  const id = useId();
  const padsRef = useRef<HTMLElement>(null);
  const audioRef = useRef<DrumAudio | null>(null);
  const takeRef = useRef<Take | null>(null);
  const timers = useRef<number[]>([]);
  const flashTimers = useRef(new Map<DrumInstrument, number>());
  const generation = useRef(0);
  const [bpmInput, setBpmInput] = useState('120');
  const [grid, setGrid] = useState<DrumRecordGrid>('16');
  const [bars, setBars] = useState(1);
  const [metronome, setMetronome] = useState(true);
  const [phase, setPhase] = useState<Phase>('idle');
  const [message, setMessage] = useState('');
  const [audioUnavailable, setAudioUnavailable] = useState(false);
  const [flashes, setFlashes] = useState<Record<string, boolean>>({});
  const [result, setResult] = useState<TabScoreData | null>(null);

  const bpm = Number(bpmInput);
  const bpmValid = Number.isInteger(bpm) && bpm >= DRUM_RECORD_BPM_MIN && bpm <= DRUM_RECORD_BPM_MAX;
  const availableBars = Math.max(0, Math.min(TAB_MEASURE_MAX, maxBars));
  const takeBars = Math.min(bars, availableBars);
  const busy = phase !== 'idle';

  useEffect(() => () => {
    generation.current += 1;
    takeRef.current = null;
    timers.current.forEach(window.clearTimeout);
    flashTimers.current.forEach(timer => window.clearTimeout(timer));
    flashTimers.current.clear();
    audioRef.current?.close();
    audioRef.current = null;
  }, []);

  function getAudio() {
    if (!audioRef.current) audioRef.current = createDrumAudio();
    if (!audioRef.current) setAudioUnavailable(true);
    return audioRef.current;
  }

  function clearSchedule() {
    generation.current += 1;
    timers.current.forEach(window.clearTimeout);
    timers.current = [];
    audioRef.current?.cancelClicks();
  }

  function finishTake() {
    const take = takeRef.current;
    takeRef.current = null;
    clearSchedule();
    setPhase('idle');
    if (!take || performance.now() < take.start) {
      setMessage('녹음을 취소했어요.');
      return;
    }

    const barMs = BEATS_PER_BAR * 60_000 / take.bpm;
    const recordedBars = Math.min(take.bars, Math.max(1, Math.ceil((performance.now() - take.start) / barMs)));
    const score = quantizeDrumTake(take.hits, { bpm: take.bpm, bars: recordedBars, grid: take.grid });
    if (score) {
      setResult(score);
      setMessage(`${score.measures.length}마디를 기록했어요.`);
    } else {
      setMessage('기록된 타격이 없어요.');
    }
  }

  function scheduleAt(timeMs: number, callback: () => void) {
    timers.current.push(window.setTimeout(callback, Math.max(0, timeMs - performance.now())));
  }

  async function startTake() {
    if (busy || disabled || takeBars < 1 || !bpmValid) return;
    clearSchedule();
    const run = generation.current;
    const audio = getAudio();
    setPhase('starting');
    setMessage('카운트인 준비 중');
    padsRef.current?.focus();
    const ready = audio ? await startAudio(audio) : false;
    if (generation.current !== run) return;
    setAudioUnavailable(!ready);
    const clickAudio = ready ? audio : null;

    const beatMs = 60_000 / bpm;
    const countdownStart = performance.now() + 40;
    const start = countdownStart + BEATS_PER_BAR * beatMs;
    const end = start + takeBars * BEATS_PER_BAR * beatMs;
    takeRef.current = { start, bpm, bars: takeBars, grid, hits: [] };
    setPhase('countdown');

    for (let beat = 0; beat < BEATS_PER_BAR; beat++) {
      const time = countdownStart + beat * beatMs;
      clickAudio?.click(time, beat === 0);
      scheduleAt(time, () => setMessage(`카운트인 ${beat + 1} / ${BEATS_PER_BAR}`));
    }
    for (let bar = 0; bar < takeBars; bar++) {
      const time = start + bar * BEATS_PER_BAR * beatMs;
      scheduleAt(time, () => {
        if (bar === 0) setPhase('recording');
        setMessage(`녹음 중 · ${bar + 1} / ${takeBars}마디`);
      });
      if (metronome) {
        for (let beat = 0; beat < BEATS_PER_BAR; beat++) clickAudio?.click(time + beat * beatMs, beat === 0);
      }
    }
    scheduleAt(end, finishTake);
  }

  function play(instrument: DrumInstrument) {
    const hitTime = performance.now();
    const take = takeRef.current;
    if (take && hitTime >= take.start && hitTime < take.start + take.bars * BEATS_PER_BAR * 60_000 / take.bpm) {
      take.hits.push({ timeMs: hitTime - take.start, instrument });
    }

    const audio = getAudio();
    audio?.resume().then(() => {
      if (audioRef.current !== audio || performance.now() - hitTime > 120) return;
      audio.hit(instrument);
      setAudioUnavailable(false);
    }).catch(() => {
      if (audioRef.current === audio) setAudioUnavailable(true);
    });

    const previous = flashTimers.current.get(instrument);
    if (previous !== undefined) window.clearTimeout(previous);
    setFlashes(active => ({ ...active, [instrument]: true }));
    flashTimers.current.set(instrument, window.setTimeout(() => {
      flashTimers.current.delete(instrument);
      setFlashes(active => ({ ...active, [instrument]: false }));
    }, 100));
  }

  function playKey(event: KeyboardEvent<HTMLElement>) {
    if (event.ctrlKey || event.altKey || event.metaKey || event.defaultPrevented) return;
    const pad = PADS.find(item => item.code === event.code);
    if (event.repeat) {
      if (pad || event.key === 'Enter' || event.key === ' ') event.preventDefault();
      return;
    }
    if (event.key === 'Escape' && busy) {
      event.preventDefault();
      finishTake();
      return;
    }
    if (!pad) return;
    event.preventDefault();
    play(pad.instrument);
  }

  function insertResult() {
    if (!result || disabled || result.measures.length > availableBars || !onInsert(result)) {
      setMessage('악보에 넣을 수 없어요. 편집 중인 묶음과 남은 마디를 확인하세요.');
      return;
    }
    setResult(null);
    setMessage('녹음한 마디를 악보에 추가했어요.');
  }

  return (
    <section className="drum-recorder" aria-label="드럼 녹음기">
      <section className="drum-recorder-settings" aria-label="녹음 설정">
        <label>
          속도 (BPM)
          <input type="number" min={DRUM_RECORD_BPM_MIN} max={DRUM_RECORD_BPM_MAX} step={1} value={bpmInput} disabled={busy}
            aria-invalid={!bpmValid} onChange={event => setBpmInput(event.target.value)} />
        </label>
        <label>
          박자 맞춤
          <select value={grid} disabled={busy} onChange={event => setGrid(event.target.value as DrumRecordGrid)}>
            {GRIDS.map(([value, name]) => <option key={value} value={value}>{name}</option>)}
          </select>
        </label>
        <label>
          녹음 길이
          <select value={takeBars || ''} disabled={busy || availableBars === 0} onChange={event => setBars(Number(event.target.value))}>
            {availableBars === 0 && <option value="">선택할 수 없음</option>}
            {Array.from({ length: availableBars }, (_, index) => (
              <option key={index} value={index + 1}>{index + 1}마디</option>
            ))}
          </select>
        </label>
        <label className="drum-recorder-metronome">
          <input type="checkbox" checked={metronome} disabled={busy} onChange={event => setMetronome(event.target.checked)} />
          녹음 중 메트로놈
        </label>
      </section>
      <p id={`${id}-hint`} className="drum-recorder-hint">4/4 한 마디를 센 뒤 녹음해요. 키보드나 패드로 연주하고 Esc로 끝낼 수 있어요.</p>
      <section className="drum-recorder-pads" ref={padsRef} tabIndex={0} onKeyDown={playKey}
        aria-label="키보드 드럼 패드" aria-describedby={`${id}-hint`} aria-keyshortcuts="Escape">
        {PADS.map(({ code, key, instrument, label }) => (
          <Button key={code} className="drum-recorder-pad" width="100%" data-hit={flashes[instrument] ? 'true' : undefined}
            label={`${label} (${key})`} aria-keyshortcuts={key} onClick={() => play(instrument)}>
            <kbd>{key}</kbd><b>{label}</b>
          </Button>
        ))}
      </section>
      <section className="drum-recorder-actions" aria-label="녹음과 추가">
        {busy ? (
          <Button label={phase === 'recording' ? '녹음 종료' : '녹음 취소'} size="sm" variant="primary" onClick={finishTake} />
        ) : (
          <Button label={result ? '다시 녹음' : '녹음 시작'} size="sm" variant={result ? 'secondary' : 'primary'}
            isDisabled={disabled || takeBars < 1 || !bpmValid} onClick={startTake} />
        )}
        {result && !busy && (
          <Button label="악보에 추가" size="sm" variant="primary" isDisabled={disabled || result.measures.length > availableBars} onClick={insertResult} />
        )}
        <p className="drum-recorder-status" role="status">{message}</p>
      </section>
      {!bpmValid && <p className="drum-recorder-hint">속도를 {DRUM_RECORD_BPM_MIN}–{DRUM_RECORD_BPM_MAX} 사이 정수로 입력하세요.</p>}
      {availableBars === 0 && <p className="drum-recorder-hint">악보의 마디가 가득 찼어요.</p>}
      {audioUnavailable && <p className="drum-recorder-hint">이 환경에서는 소리 없이 타격을 기록해요.</p>}
      {result && !busy && <TabScore score={result} />}
    </section>
  );
}

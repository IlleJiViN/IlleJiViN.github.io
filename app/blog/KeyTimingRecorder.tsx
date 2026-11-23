'use client';

import { useId, useRef, useState, type KeyboardEvent } from 'react';
import { Button } from '@astryxdesign/core/Button';

type KeyHit = { key: string; time: number };

const MODIFIER_KEYS = new Set([
  'Shift', 'Control', 'Alt', 'AltGraph', 'Meta', 'OS',
  'CapsLock', 'NumLock', 'ScrollLock', 'Fn', 'FnLock',
  'Super', 'Hyper', 'Symbol', 'SymbolLock',
]);

const seconds = (ms: number) => (ms / 1000).toFixed(3);

export default function KeyTimingRecorder() {
  const hintId = useId();
  const captureRef = useRef<HTMLElement>(null);
  const outputRef = useRef<HTMLTextAreaElement>(null);
  const [recording, setRecording] = useState(false);
  const [hits, setHits] = useState<KeyHit[]>([]);
  const [copyStatus, setCopyStatus] = useState('');

  const text = hits.length ? [
    'key\telapsed_s\tdelta_s',
    ...hits.map((hit, index) => [
      hit.key,
      seconds(hit.time - hits[0].time),
      seconds(index === 0 ? 0 : hit.time - hits[index - 1].time),
    ].join('\t')),
  ].join('\n') : '';

  function start() {
    setHits([]);
    setCopyStatus('');
    setRecording(true);
    captureRef.current?.focus();
  }

  function recordKey(event: KeyboardEvent<HTMLElement>) {
    if (!recording || event.target !== event.currentTarget || event.repeat || event.defaultPrevented) return;

    if (event.key === 'Escape') {
      event.preventDefault();
      setRecording(false);
      return;
    }
    if (event.key === 'Tab' || MODIFIER_KEYS.has(event.key) || event.ctrlKey || event.metaKey || event.altKey) return;

    const hasPhysicalCode = event.code && event.code !== 'Unidentified';
    if (!hasPhysicalCode && (event.nativeEvent.isComposing || event.key === 'Process' || event.key === 'Unidentified')) return;

    const key = hasPhysicalCode ? event.code : event.key === ' ' ? 'Space' : event.key.replace(/[\t\r\n]/g, ' ');
    if (!key.trim()) return;

    event.preventDefault();
    // Older browsers can report event timestamps relative to the Unix epoch.
    const eventTime = event.timeStamp > 1e12 ? event.timeStamp - performance.timeOrigin : event.timeStamp;
    const time = Number.isFinite(eventTime) && eventTime > 0 ? eventTime : performance.now();
    setHits(previous => [...previous, { key, time: Math.max(time, previous.at(-1)?.time ?? time) }]);
    setCopyStatus('');
  }

  async function copyText() {
    const output = outputRef.current;
    if (!output) return;
    output.focus({ preventScroll: true });
    output.select();

    try {
      await navigator.clipboard.writeText(text);
      setCopyStatus('복사했어요. 선택된 텍스트는 Ctrl+C 또는 Cmd+C로도 복사할 수 있어요.');
    } catch {
      setCopyStatus('텍스트를 선택했어요. Ctrl+C 또는 Cmd+C로 복사하세요.');
    }
  }

  return (
    <section className="key-timing" aria-label="키 입력 간격">
      <section className="key-timing-actions" aria-label="키 기록 조작">
        {recording ? (
          <Button label="기록 종료" variant="primary" size="sm" onClick={() => setRecording(false)} />
        ) : (
          <Button label={text ? '새 기록 시작' : '기록 시작'} variant={text ? 'secondary' : 'primary'} size="sm" onClick={start} />
        )}
        <Button label="텍스트 복사" variant={text && !recording ? 'primary' : 'secondary'} size="sm" isDisabled={!text} onClick={copyText} />
        <p className="key-timing-count">{hits.length}개 입력</p>
      </section>
      <p id={hintId} className="key-timing-hint">첫 입력을 0초로 잡아요. 키를 누르고 Esc로 끝내세요.</p>
      <section
        ref={captureRef}
        className="key-timing-capture"
        data-recording={recording ? 'true' : undefined}
        tabIndex={0}
        aria-label="키 입력 영역"
        aria-describedby={hintId}
        onKeyDown={recordKey}
      >
        <p role="status">{recording ? '기록 중 · 여기에 키를 누르세요' : '키 입력 영역'}</p>
      </section>
      {text && (
        <label className="key-timing-output">
          기록 텍스트
          <textarea ref={outputRef} rows={6} wrap="off" value={text} readOnly spellCheck={false} />
        </label>
      )}
      <p className="key-timing-copy-status" role="status">{copyStatus}</p>
    </section>
  );
}

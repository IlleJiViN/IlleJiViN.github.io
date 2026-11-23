"use client";

import { useEffect, type RefObject } from 'react';

type Row = { group: HTMLElement; button: HTMLElement; cover: HTMLElement; chevron: HTMLElement | null };
const clamp = (value: number, min = -1, max = 1) => Math.max(min, Math.min(max, value));

export default function useProjectMotion(
  indexRef: RefObject<HTMLDivElement | null>,
  project: string,
  query: string,
  postId: number | null,
  compact: boolean,
  page = 0,
) {
  useEffect(() => {
    const index = indexRef.current;
    if (!index) return;
    const motionTiming = (maximum: number) => {
      const styles = getComputedStyle(index);
      const duration = Number.parseFloat(styles.getPropertyValue('--music-motion-duration'));
      return {
        duration: Number.isFinite(duration) ? Math.min(maximum, duration) : maximum,
        easing: styles.getPropertyValue('--music-motion-easing').trim() || 'cubic-bezier(.22,.61,.36,1)',
      };
    };
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
    const groups = [...index.querySelectorAll<HTMLElement>('.project')];
    const animations = new Map<HTMLElement, Animation>();
    const removers: Array<() => void> = [];
    let activeRow: Row | null = null;
    let pointerX = 0;
    let pointerY = 0;
    let frame = 0;

    const resetRow = (row: Row) => {
      row.group.removeAttribute('data-pointer-active');
      for (const name of ['--row-x', '--row-y']) row.button.style.removeProperty(name);
      for (const name of ['--rotate-x', '--rotate-y', '--cover-x', '--cover-y']) row.cover.style.removeProperty(name);
      for (const name of ['--magnet-x', '--magnet-y']) row.chevron?.style.removeProperty(name);
    };
    const clearMotion = () => {
      animations.forEach(animation => animation.cancel());
      animations.clear();
      if (activeRow) resetRow(activeRow);
      activeRow = null;
      window.cancelAnimationFrame(frame);
      frame = 0;
      document.documentElement.style.removeProperty('--pointer-x');
      document.documentElement.style.removeProperty('--pointer-y');
    };
    const canTrack = () => !reduced.matches && finePointer.matches;
    const drawPointer = () => {
      frame = 0;
      if (!canTrack()) return;
      const row = activeRow;
      // Read geometry before writing styles so one frame needs at most one layout.
      const rect = row?.button.getBoundingClientRect();
      const chevron = row?.chevron?.getBoundingClientRect();
      document.documentElement.style.setProperty('--pointer-x', `${pointerX}px`);
      document.documentElement.style.setProperty('--pointer-y', `${pointerY + window.scrollY}px`);
      if (!row || !rect || !rect.width || !rect.height) return;
      const x = clamp((pointerX - rect.left) / rect.width, 0, 1);
      const y = clamp((pointerY - rect.top) / rect.height, 0, 1);
      row.button.style.setProperty('--row-x', `${pointerX - rect.left}px`);
      row.button.style.setProperty('--row-y', `${pointerY - rect.top}px`);
      row.cover.style.setProperty('--rotate-x', `${((0.5 - y) * 12).toFixed(2)}deg`);
      row.cover.style.setProperty('--rotate-y', `${((x - 0.5) * 12).toFixed(2)}deg`);
      row.cover.style.setProperty('--cover-x', `${(x * 100).toFixed(1)}%`);
      row.cover.style.setProperty('--cover-y', `${(y * 100).toFixed(1)}%`);
      if (chevron) {
        const dx = pointerX - (chevron.left + chevron.width / 2);
        const dy = pointerY - (chevron.top + chevron.height / 2);
        const strength = Math.max(0, 1 - Math.hypot(dx, dy) / 120);
        row.chevron?.style.setProperty('--magnet-x', `${(clamp(dx / 30) * 3 * strength).toFixed(2)}px`);
        row.chevron?.style.setProperty('--magnet-y', `${(clamp(dy / 30) * 3 * strength).toFixed(2)}px`);
      }
    };
    const schedule = (event: PointerEvent) => {
      if (!canTrack() || event.pointerType !== 'mouse') return;
      pointerX = event.clientX;
      pointerY = event.clientY;
      if (!frame) frame = window.requestAnimationFrame(drawPointer);
    };
    const onPreference = () => { if (!canTrack()) clearMotion(); };
    reduced.addEventListener('change', onPreference);
    finePointer.addEventListener('change', onPreference);
    window.addEventListener('pointermove', schedule, { passive: true });
    const onDetailFocus = (event: FocusEvent) => {
      const tracks = (event.target as HTMLElement).closest<HTMLElement>('.project-tracks');
      if (tracks) animations.get(tracks)?.cancel();
    };
    index.addEventListener('focusin', onDetailFocus);

    for (const group of groups) {
      const button = group.querySelector<HTMLElement>('.project-toggle');
      const cover = group.querySelector<HTMLElement>('.project-cover');
      if (!button || !cover) continue;
      const row: Row = { group, button, cover, chevron: group.querySelector<HTMLElement>('.project-chevron') };
      const onEnter = (event: PointerEvent) => {
        if (!canTrack() || event.pointerType !== 'mouse') return;
        if (activeRow && activeRow !== row) resetRow(activeRow);
        activeRow = row;
        group.setAttribute('data-pointer-active', '');
        schedule(event);
      };
      const onLeave = () => {
        resetRow(row);
        if (activeRow === row) activeRow = null;
      };
      const onFocus = () => {
        animations.get(group)?.cancel();
        const tracks = group.querySelector<HTMLElement>('.project-tracks');
        if (tracks?.contains(document.activeElement)) animations.get(tracks)?.cancel();
      };
      button.addEventListener('pointerenter', onEnter);
      button.addEventListener('pointerleave', onLeave);
      group.addEventListener('focusin', onFocus);
      removers.push(() => {
        button.removeEventListener('pointerenter', onEnter);
        button.removeEventListener('pointerleave', onLeave);
        group.removeEventListener('focusin', onFocus);
        resetRow(row);
      });
    }

    const observer = 'IntersectionObserver' in window ? new IntersectionObserver(changes => {
      for (const change of changes) {
        const group = change.target as HTMLElement;
        if (!change.isIntersecting || reduced.matches || group.contains(document.activeElement) || typeof group.animate !== 'function') continue;
        animations.get(group)?.cancel();
        animations.set(group, group.animate([
          { opacity: 0.55, transform: 'translateY(12px)' },
          { opacity: 1, transform: 'translateY(0)' },
        ], motionTiming(480)));
      }
    }, { threshold: 0.16, rootMargin: '0px 0px -12px 0px' }) : null;
    groups.forEach(group => observer?.observe(group));

    const disclosureObserver = 'MutationObserver' in window ? new MutationObserver(changes => {
      if (reduced.matches) return;
      for (const change of changes) {
        const tracks = change.target as HTMLElement;
        if (tracks.hidden || !tracks.classList.contains('project-tracks') || typeof tracks.animate !== 'function') continue;
        animations.get(tracks)?.cancel();
        animations.set(tracks, tracks.animate([
          { opacity: 0.35, transform: 'translateY(-5px)' },
          { opacity: 1, transform: 'translateY(0)' },
        ], motionTiming(240)));
      }
    }) : null;
    disclosureObserver?.observe(index, { subtree: true, attributes: true, attributeFilter: ['hidden'] });

    return () => {
      observer?.disconnect();
      disclosureObserver?.disconnect();
      clearMotion();
      removers.forEach(remove => remove());
      reduced.removeEventListener('change', onPreference);
      finePointer.removeEventListener('change', onPreference);
      window.removeEventListener('pointermove', schedule);
      index.removeEventListener('focusin', onDetailFocus);
    };
  }, [indexRef, project, query, postId, compact, page]);
}

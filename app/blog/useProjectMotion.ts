"use client";

import { useEffect, type RefObject } from 'react';

type Row = { group: HTMLElement; button: HTMLElement; cover: HTMLElement; chevron: HTMLElement | null };
const clamp = (value: number, min = -1, max = 1) => Math.max(min, Math.min(max, value));

export default function useProjectMotion(
  indexRef: RefObject<HTMLDivElement | null>,
  project: string,
  query: string,
  compact: boolean,
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
    let activeSlide: HTMLElement | null = null;
    let pointedSlide: HTMLElement | null = null;
    let pointerX = 0;
    let pointerY = 0;
    let frame = 0;

    const resetRow = (row: Row) => {
      row.group.removeAttribute('data-pointer-active');
      for (const name of ['--row-x', '--row-y']) row.button.style.removeProperty(name);
      for (const name of ['--rotate-x', '--rotate-y']) row.cover.style.removeProperty(name);
      row.group.style.removeProperty('--staff-line-drift');
      for (const name of ['--magnet-x', '--magnet-y']) row.chevron?.style.removeProperty(name);
    };
    const resetSlide = () => {
      if (!activeSlide) return;
      activeSlide.removeAttribute('data-staff-tracking');
      activeSlide.style.removeProperty('--staff-light-x');
      activeSlide.style.removeProperty('--staff-light-y');
      activeSlide = null;
    };
    const clearMotion = () => {
      animations.forEach(animation => animation.cancel());
      animations.clear();
      if (activeRow) resetRow(activeRow);
      activeRow = null;
      resetSlide();
      pointedSlide = null;
      window.cancelAnimationFrame(frame);
      frame = 0;
      document.documentElement.style.removeProperty('--pointer-x');
      document.documentElement.style.removeProperty('--pointer-y');
    };
    const isExpressive = () => document.documentElement.dataset.scoreView !== 'clear';
    const canTrack = () => isExpressive() && !reduced.matches && finePointer.matches;
    const drawPointer = () => {
      frame = 0;
      if (!canTrack()) return;
      const row = activeRow;
      const slide = pointedSlide?.closest('[data-dragging]') ? null : pointedSlide;
      // Read geometry before writing styles so one frame needs at most one layout.
      const paper = slide?.getBoundingClientRect();
      const rect = row?.button.getBoundingClientRect();
      const chevron = row?.chevron?.getBoundingClientRect();
      if (activeSlide !== slide) resetSlide();
      if (slide && paper?.width && paper.height) {
        const x = 100 * clamp((pointerX - paper.left) / paper.width, 0, 1);
        const y = 100 * clamp((pointerY - paper.top) / paper.height, 0, 1);
        slide.style.setProperty('--staff-light-x', `${x.toFixed(1)}%`);
        slide.style.setProperty('--staff-light-y', `${y.toFixed(1)}%`);
        slide.setAttribute('data-staff-tracking', '');
        activeSlide = slide;
      }
      document.documentElement.style.setProperty('--pointer-x', `${pointerX}px`);
      document.documentElement.style.setProperty('--pointer-y', `${pointerY + window.scrollY}px`);
      if (!row || !slide?.contains(row.group) || !rect?.width || !rect.height) return;
      const x = clamp((pointerX - rect.left) / rect.width, 0, 1);
      const y = clamp((pointerY - rect.top) / rect.height, 0, 1);
      row.group.style.setProperty('--staff-line-drift', `${((y - 0.5) * 0.26).toFixed(3)}rem`);
      row.button.style.setProperty('--row-x', `${pointerX - rect.left}px`);
      row.button.style.setProperty('--row-y', `${pointerY - rect.top}px`);
      row.cover.style.setProperty('--rotate-x', `${((0.5 - y) * 12).toFixed(2)}deg`);
      row.cover.style.setProperty('--rotate-y', `${((x - 0.5) * 12).toFixed(2)}deg`);
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
      const slide = event.target instanceof Element ? event.target.closest<HTMLElement>('.score-slide') : null;
      pointedSlide = index.contains(slide) ? slide : null;
      if (!frame) frame = window.requestAnimationFrame(drawPointer);
    };
    const onPreference = () => { if (!canTrack()) clearMotion(); };
    reduced.addEventListener('change', onPreference);
    finePointer.addEventListener('change', onPreference);
    window.addEventListener('pointermove', schedule, { passive: true });
    const viewObserver = new MutationObserver(onPreference);
    viewObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-score-view'] });

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
        const copy = group.querySelector<HTMLElement>('.project-copy');
        if (!change.isIntersecting || !isExpressive() || reduced.matches || group.contains(document.activeElement) || !copy?.animate || group.closest('[data-dragging]')) continue;
        animations.get(group)?.cancel();
        animations.set(group, copy.animate([
          { opacity: 0.65, transform: 'translateY(4px)' },
          { opacity: 1, transform: 'translateY(0)' },
        ], motionTiming(480)));
      }
    }, { threshold: 0.16, rootMargin: '0px 0px -12px 0px' }) : null;
    groups.forEach(group => observer?.observe(group));

    return () => {
      observer?.disconnect();
      viewObserver.disconnect();
      clearMotion();
      removers.forEach(remove => remove());
      reduced.removeEventListener('change', onPreference);
      finePointer.removeEventListener('change', onPreference);
      window.removeEventListener('pointermove', schedule);
    };
  }, [indexRef, project, query, compact]);
}

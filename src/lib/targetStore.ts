"use client";

import { useSyncExternalStore } from "react";
import { MOCK_PERSONAS } from "./mock";
import type { Persona, PersonaColor } from "./types";

/**
 * 02 타깃 목록의 브라우저 임시 저장. 01 아이디어 입력과 같은 방식(localStorage)이다.
 * - 추천 카드를 "고치기"로 바꾼 내용 (source: "edited")
 * - 02-1 에서 직접 만든 사람 (source: "custom")
 *
 * 서버에는 저장소가 없으니 서버 렌더에서는 추천 원본을 쓰고, 브라우저에서 읽은 뒤
 * 저장된 내용으로 바뀐다(useSyncExternalStore). 서버 저장이 붙으면 이 파일만 바꾸면 된다.
 * TODO: 04 대화·03 비교는 아직 MOCK_PERSONAS 를 직접 읽는다 — 화면 사이 데이터 연결 때 이걸 쓰게 한다.
 */

const KEY = "soul:targets:v1";
type Stored = { edited: Record<string, Persona>; custom: Persona[] };
const EMPTY: Stored = { edited: {}, custom: [] };

const listeners = new Set<() => void>();
let cache: { raw: string | null; value: Persona[] } | null = null;

function readStored(): Stored {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? { ...EMPTY, ...JSON.parse(raw) } : EMPTY;
  } catch {
    return EMPTY; // 사생활 보호 모드 등에서 막히면 저장 없이 쓴다
  }
}

function merge(stored: Stored): Persona[] {
  return [...MOCK_PERSONAS.map((p) => stored.edited[p.id] ?? p), ...stored.custom];
}

function snapshot(): Persona[] {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(KEY);
  } catch {
    raw = null;
  }
  // 같은 내용이면 같은 배열을 돌려줘야 useSyncExternalStore 가 다시 그리지 않는다
  if (!cache || cache.raw !== raw) cache = { raw, value: merge(readStored()) };
  return cache.value;
}

const serverSnapshot = () => MOCK_PERSONAS;

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  const onStorage = (e: StorageEvent) => e.key === KEY && onChange();
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener("storage", onStorage);
  };
}

/** 02 목록에 보일 사람 전부 — 추천(고친 내용 반영) + 직접 만든 사람 */
export function useTargets(): Persona[] {
  return useSyncExternalStore(subscribe, snapshot, serverSnapshot);
}

/**
 * 저장한다. 추천 카드면 edited 로, 직접 만든 사람이면 custom 으로 넣는다.
 * 새로 만드는 사람은 id 와 색을 여기서 정한다.
 */
export function saveTarget(persona: Persona): Persona {
  const stored = readStored();
  const isRecommended = MOCK_PERSONAS.some((p) => p.id === persona.id);
  let saved = persona;
  if (isRecommended) {
    saved = { ...persona, source: "edited" };
    stored.edited = { ...stored.edited, [persona.id]: saved };
  } else if (stored.custom.some((p) => p.id === persona.id)) {
    stored.custom = stored.custom.map((p) => (p.id === persona.id ? persona : p));
  } else {
    saved = { ...persona, id: `c${Date.now().toString(36)}`, source: "custom", color: nextColor(stored) };
    stored.custom = [...stored.custom, saved];
  }
  try {
    localStorage.setItem(KEY, JSON.stringify(stored));
  } catch {
    // 저장이 막히면 이번 화면에서만 반영되지 않는다
  }
  listeners.forEach((l) => l());
  return saved;
}

/** 직접 만든 사람 색: 가장 덜 쓰인 페르소나 색. 파랑·초록은 브랜드색이라 5색 안에서만 고른다 */
function nextColor(stored: Stored): PersonaColor {
  const used = merge(stored).map((p) => p.color);
  const colors: PersonaColor[] = [1, 2, 3, 4, 5];
  return colors.reduce((best, c) =>
    used.filter((u) => u === c).length < used.filter((u) => u === best).length ? c : best,
  );
}

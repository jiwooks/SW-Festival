import type { ChatIdea } from "./types";

/** 01 아이디어 입력의 브라우저 임시 저장 키. 01 이 쓰고 04 대화가 읽는다. */
export const IDEA_DRAFT_KEY = "soul.idea.draft";

/** 저장된 01 입력을 읽는다. 없거나 막혀 있으면 undefined — 서버가 기본 아이디어를 쓴다 */
export function readIdeaDraft(): ChatIdea | undefined {
  try {
    const raw = localStorage.getItem(IDEA_DRAFT_KEY);
    if (!raw) return undefined;
    const d = JSON.parse(raw) as ChatIdea;
    return d.oneLiner?.trim() ? d : undefined;
  } catch {
    return undefined;
  }
}

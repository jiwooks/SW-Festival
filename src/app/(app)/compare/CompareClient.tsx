"use client";

import Link from "next/link";
import { Chip } from "@/components/Chip";
import { PersonaAvatar } from "@/components/PersonaAvatar";
import { MOCK_PERSONAS, MOCK_PRESELECTED } from "@/lib/mock";
import type { Persona } from "@/lib/types";

/** "박민수" → "민수님". 세 글자 이름만 성을 뗀다. 아니면 그대로 부른다. */
function honorific(name: string) {
  return name.length === 3 ? `${name.slice(1)}님` : `${name}님`;
}

/** 셋이 공유하는 키워드가 하나도 없으면 그 항목은 갈린다고 본다. */
function splits(picked: Persona[], pick: (p: Persona) => string[]) {
  const [first, ...rest] = picked.map(pick);
  return !first.some((kw) => rest.every((other) => other.includes(kw)));
}

/**
 * 값이 실제로 갈릴 때만 "갈린다"고 말하고, 비슷하면 그렇다고 알린다.
 * 둘 다 같은 자리에 뜬다. (CLAUDE.md 9절 — 03 화면)
 */
function banner(picked: Persona[]) {
  const differs = splits(picked, (p) => p.interests);

  if (!differs) {
    return {
      tone: "flat" as const,
      title: "세 분이 비슷한 데를 보고 있어요",
      body: "관심사가 겹쳐서 의견이 잘 안 갈릴 수 있어요. 한 명을 다른 사람으로 바꾸면 더 많은 이야기가 나옵니다.",
    };
  }

  const each = picked
    .map((p) => `${honorific(p.name)}은 "${p.interests[0]}"`)
    .join(", ");

  return {
    tone: "conflict" as const,
    title: "세 분이 보는 데가 서로 달라요",
    body: `${each}을(를) 먼저 봅니다. 같은 아이디어를 놓고도 다른 데를 짚을 가능성이 커요.`,
  };
}

const LABEL_CELL =
  "w-[118px] shrink-0 bg-th p-4 font-mono text-[11px] font-medium tracking-[0.08em] text-ink-3";
const CELL = "grow basis-0 border-l border-divider px-[18px] py-4";

function PencilIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M4 20h4L19 9a2.1 2.1 0 0 0-3-3L5 17z" />
    </svg>
  );
}

export function CompareClient() {
  const picked = MOCK_PERSONAS.filter((p) => MOCK_PRESELECTED.includes(p.id));
  const { tone, title, body } = banner(picked);

  return (
    <>
      <main className="flex grow flex-col gap-[18px] px-[70px] pt-[30px] pb-6">
        <div className="flex items-end gap-4">
          <div className="flex grow flex-col gap-[7px]">
            <p className="font-mono text-xs font-medium tracking-[0.14em] text-muted">
              STEP 03
            </p>
            <h1 className="text-[28px] font-bold leading-[1.38] tracking-[-0.022em]">
              고른 세 명, 한눈에 보기
            </h1>
            <p className="text-[15px] leading-[1.7] text-ink-3">
              나란히 놓고 보면 어디서 부딪힐지 미리 보여요. 어색한 부분은 지금 고치는 게
              좋아요.
            </p>
          </div>
          {/* AI 대화 결과를 실제 검증처럼 포장하지 않는다 */}
          <p className="flex h-8 shrink-0 items-center gap-[7px] rounded-[9px] bg-bubble px-3 text-xs text-ink-3">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="9" />
              <path d="M12 16v-5M12 8h.01" />
            </svg>
            실제 사람이 아니라 AI가 만든 가상 인물이에요
          </p>
        </div>

        <section
          className={`flex flex-col gap-[5px] rounded-[14px] px-5 py-4 ${
            tone === "conflict"
              ? "bg-conflict-bg text-conflict-fg"
              : "bg-bubble text-ink-2"
          }`}
        >
          <h2 className="text-sm font-semibold">{title}</h2>
          <p className="text-sm leading-[1.75]">{body}</p>
        </section>

        <div className="flex flex-col overflow-hidden rounded-card border border-card bg-base">
          {/* 머리 행 — 누구인지 */}
          <div className="flex border-b border-line">
            <div className="w-[118px] shrink-0 bg-th px-4 py-[18px]" />
            {picked.map((p) => (
              <div
                key={p.id}
                className="flex grow basis-0 items-center gap-[11px] border-l border-divider px-[18px] py-4"
              >
                <PersonaAvatar name={p.name} color={p.color} size="lg" />
                <div className="flex grow flex-col gap-px">
                  <p className="text-[16px] font-semibold">{p.name}</p>
                  <p className="text-xs text-muted">
                    {[p.age, p.gender, p.occupation].filter(Boolean).join(" · ")}
                  </p>
                </div>
                {/* TODO: 카드 고치기 패널 */}
                <button
                  type="button"
                  aria-label={`${p.name} 고치기`}
                  className="flex size-[34px] shrink-0 items-center justify-center rounded-[10px] border border-btn-border bg-base text-ink-3"
                >
                  <PencilIcon />
                </button>
              </div>
            ))}
          </div>

          <div className="flex border-b border-divider">
            <div className={LABEL_CELL}>요즘 상황</div>
            {picked.map((p) => (
              <div key={p.id} className={`${CELL} text-sm leading-[1.8] text-ink-2`}>
                {p.situation}
              </div>
            ))}
          </div>

          <div className="flex border-b border-divider">
            <div className={LABEL_CELL}>관심사</div>
            {picked.map((p) => (
              <div key={p.id} className={`${CELL} flex flex-wrap content-start gap-[5px]`}>
                {p.interests.map((item) => (
                  <Chip key={item}>{item}</Chip>
                ))}
              </div>
            ))}
          </div>

          <div className="flex border-b border-divider">
            <div className={LABEL_CELL}>걱정</div>
            {picked.map((p) => (
              <div key={p.id} className={`${CELL} flex flex-wrap content-start gap-[5px]`}>
                {p.worries.map((item) => (
                  <Chip key={item} tone="conflict">
                    {item}
                  </Chip>
                ))}
              </div>
            ))}
          </div>

          {/* 이 행이 대화의 목적이라 강조한다 */}
          <div className="flex">
            <div className="w-[118px] shrink-0 bg-action-bg p-4 font-mono text-[11px] font-semibold tracking-[0.08em] text-brand">
              물어볼 것
            </div>
            {picked.map((p) => (
              <div
                key={p.id}
                className="grow basis-0 border-l border-action-border bg-hl px-[18px] py-4 text-sm font-medium leading-[1.65]"
              >
                {p.checkpoint}
              </div>
            ))}
          </div>
        </div>
      </main>

      <footer className="flex h-[82px] shrink-0 items-center gap-3 border-t border-line bg-base px-[70px]">
        <Link
          href="/targets"
          className="inline-flex h-[46px] shrink-0 items-center rounded-btn border border-btn-border bg-base px-[18px] text-sm text-ink-2"
        >
          사람 바꾸기
        </Link>
        <p className="grow text-sm text-muted">
          먼저 세 명이 함께 이야기하고, 더 듣고 싶은 사람과는 따로 대화할 수 있어요.
        </p>
        <Link
          href="/chat"
          className="inline-flex h-12 shrink-0 items-center rounded-btn bg-brand px-[26px] text-[15px] font-semibold text-white"
        >
          대화 시작하기
        </Link>
      </footer>
    </>
  );
}

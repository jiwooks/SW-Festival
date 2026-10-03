"use client";

import { useState } from "react";
import Link from "next/link";
import { PageFooterBar } from "@/components/PageFooterBar";
import { PersonaCard } from "@/components/PersonaCard";
import { MOCK_IDEA_SUMMARY, MOCK_PERSONAS, MOCK_PRESELECTED } from "@/lib/mock";
import type { Persona } from "@/lib/types";

/** 대화는 1:3 으로 고정이다. 2명이면 핑퐁이고 4명 이상은 순차 발화라 읽기 벅차다. */
const PICK_COUNT = 3;

/** 사람을 셀 때는 "1명"이 아니라 "한 명". 시안 문구를 기준으로 삼는다. */
const COUNT_WORD = ["영", "한", "두", "세"] as const;

/**
 * 고른 사람들 사이에서 그 항목이 갈리는지 본다.
 * 셋이 공유하는 키워드가 하나도 없으면 갈린다고 본다.
 */
function splits(picked: Persona[], pick: (p: Persona) => string[]) {
  const [first, ...rest] = picked.map(pick);
  return !first.some((kw) => rest.every((other) => other.includes(kw)));
}

/**
 * 하단 문구. 값이 실제로 갈릴 때만 "갈리는 지점"을 말하고,
 * 비슷하면 그렇다고 알린다. 하드코딩하면 데이터가 바뀔 때 거짓말이 된다.
 */
function footerText(picked: Persona[]) {
  const names = picked.map((p) => p.name).join(" · ");

  if (picked.length < PICK_COUNT) {
    return {
      title:
        picked.length === 0
          ? "아직 고른 사람이 없어요"
          : `${names}, ${COUNT_WORD[picked.length]} 명 골랐어요`,
      description: `${COUNT_WORD[PICK_COUNT]} 명을 골라야 대화를 시작할 수 있어요.`,
    };
  }

  const points = [
    splits(picked, (p) => p.interests) && "관심사",
    splits(picked, (p) => p.worries) && "걱정",
  ].filter((x): x is string => Boolean(x));

  return {
    title: `${names}, ${COUNT_WORD[PICK_COUNT]} 명 골랐어요`,
    description:
      points.length > 0
        ? `${points.join("도 ")}도 서로 달라서, 의견이 갈리는 지점을 볼 수 있어요.`
        : "세 분이 비슷해서 의견이 잘 안 갈릴 수 있어요.",
  };
}

const SECONDARY_BTN =
  "inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-btn border border-btn-border bg-base px-4 text-sm text-ink-2";

export function TargetsClient() {
  const [pickedIds, setPickedIds] = useState<string[]>(MOCK_PRESELECTED);

  const toggle = (id: string) =>
    setPickedIds((prev) =>
      prev.includes(id)
        ? prev.filter((x) => x !== id)
        : prev.length < PICK_COUNT
          ? [...prev, id]
          : prev,
    );

  // 고른 순서가 아니라 카드에 보이는 순서로 이름을 읽어준다
  const picked = MOCK_PERSONAS.filter((p) => pickedIds.includes(p.id));
  const full = pickedIds.length >= PICK_COUNT;
  const { title, description } = footerText(picked);

  return (
    <>
      <main className="flex grow flex-col gap-5 px-20 pt-[30px] pb-6">
        {/* 01 에서 읽어온 내용. 틀리면 여기서 되돌아가 고친다 */}
        <section className="flex items-center gap-7 rounded-card border border-card bg-base px-6 py-[18px]">
          <h2 className="shrink-0 font-mono text-[11px] font-semibold tracking-[0.14em] text-muted">
            읽은 내용
          </h2>
          <dl className="flex grow items-center gap-7">
            {[
              { k: "풀려는 문제", v: MOCK_IDEA_SUMMARY.problem },
              { k: "푸는 방법", v: MOCK_IDEA_SUMMARY.solution },
              { k: "겪을 사람", v: MOCK_IDEA_SUMMARY.likelyAudience },
            ].map((row) => (
              <div key={row.k} className="flex flex-col gap-[3px]">
                <dt className="text-xs text-muted">{row.k}</dt>
                <dd className="text-sm font-medium">{row.v}</dd>
              </div>
            ))}
          </dl>
          <Link href="/new" className={SECONDARY_BTN}>
            고칠래요
          </Link>
        </section>

        <div className="flex items-end gap-4">
          <div className="flex grow flex-col gap-[7px]">
            <p className="font-mono text-xs font-medium tracking-[0.14em] text-muted">
              STEP 02
            </p>
            <h1 className="text-[28px] font-bold leading-[1.38] tracking-[-0.022em]">
              타깃 후보를 추천하고, 고칩니다
            </h1>
            <p className="text-[15px] leading-[1.7] text-ink-3">
              확정된 타깃이 아니라 후보예요. 세 명을 고르면 대화가 시작되고, 내용은
              얼마든지 고칠 수 있어요.
            </p>
          </div>
          {/* TODO: 추천 다시 받기 — AI팀 엔드포인트 연결 후 */}
          <button type="button" className={SECONDARY_BTN}>
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M21 12a9 9 0 1 1-3-6.7" />
              <path d="M21 4v5h-5" />
            </svg>
            다시 찾아보기
          </button>
        </div>

        <ul className="grid grid-cols-3 gap-[18px]">
          {MOCK_PERSONAS.map((persona) => (
            <li key={persona.id} className="flex">
              <PersonaCard
                persona={persona}
                selected={pickedIds.includes(persona.id)}
                selectDisabled={full}
                onToggle={() => toggle(persona.id)}
              />
            </li>
          ))}

          <li className="flex">
            <div className="flex grow flex-col items-center justify-center gap-[11px] rounded-card border border-dashed border-btn-border bg-panel px-[22px] py-6">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="var(--brand)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M12 5v14M5 12h14" />
              </svg>
              <h3 className="text-[15px] font-semibold">직접 만들기</h3>
              <p className="max-w-[280px] text-center text-[13px] leading-[1.7] text-ink-3">
                이름과 상황 한 줄만 쓰면 나머지 항목은 채워드려요. 인터뷰 녹취나 설문
                파일을 올려도 돼요.
              </p>
              <Link href="/targets/new" className={`${SECONDARY_BTN} mt-1 px-[18px]`}>
                만들러 가기
              </Link>
            </div>
          </li>
        </ul>
      </main>

      <PageFooterBar title={title} description={description}>
        {full ? (
          <Link
            href="/compare"
            className="inline-flex h-12 shrink-0 items-center rounded-btn bg-brand px-[26px] text-[15px] font-semibold text-white"
          >
            이 세 명으로 진행하기
          </Link>
        ) : (
          <button
            type="button"
            disabled
            className="h-12 shrink-0 rounded-btn bg-bubble px-[26px] text-[15px] font-semibold text-muted"
          >
            이 세 명으로 진행하기
          </button>
        )}
      </PageFooterBar>
    </>
  );
}

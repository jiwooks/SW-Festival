"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AppHeader } from "@/components/AppHeader";

/**
 * 모두의창업 지원서 문항 구조를 따른다. 한 칸짜리 입력으로 줄이지 않는다.
 * 필수는 네 개뿐이고 나머지는 접어둔다 — 빈칸 열 개를 다 채우게 하면 아무도 안 쓴다.
 *
 * 저장은 아직 서버가 없어서 브라우저에만 둔다. 헤더의 "저장됨" 표시가
 * 거짓말이 되지 않도록, 실제로 저장이 끝난 뒤에만 띄운다.
 */
const DRAFT_KEY = "soul.idea.draft";

type FieldName =
  | "oneLiner"
  | "field"
  | "customerType"
  | "description"
  | "problemAndDiff"
  | "background"
  | "revenueModel"
  | "executionPlan"
  | "founderStrength";

type Draft = Record<FieldName, string>;

const EMPTY: Draft = {
  oneLiner: "",
  field: "IT",
  customerType: "개인 고객에게 팝니다",
  description: "",
  problemAndDiff: "",
  background: "",
  revenueModel: "",
  executionPlan: "",
  founderStrength: "",
};

const CARD = "flex flex-col gap-[18px] rounded-card border border-card bg-base px-[26px] py-6";
const EYEBROW = "font-mono text-[11px] font-semibold tracking-[0.14em] text-brand";
const LABEL = "text-sm font-medium text-ink-2";
const INPUT =
  "h-11 w-full rounded-[11px] border border-input-border bg-input px-3.5 text-[15px]";
const AREA =
  "w-full resize-none rounded-[11px] border border-input-border bg-input px-3.5 py-3 text-[15px] leading-[1.7]";
const GHOST_BTN =
  "flex h-11 items-center gap-[7px] self-start rounded-btn border border-btn-border bg-base px-3.5 text-sm";

function Required() {
  return <span className="text-conflict-fg">*</span>;
}

function PlusIcon() {
  return (
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
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

export function IdeaFormClient() {
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [showIdeaExtra, setShowIdeaExtra] = useState(false);
  const [showPlanExtra, setShowPlanExtra] = useState(false);
  const loaded = useRef(false);

  // 서버에는 localStorage 가 없으니 첫 렌더에서는 읽지 않는다. 읽으면 서버 HTML 과
  // 어긋나 hydration 이 깨진다. 마운트 뒤 한 번만 꺼내 넣는 게 맞는 자리라
  // setState-in-effect 규칙을 여기서만 끈다.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- 외부 저장소에서 한 번 복원
      if (raw) setDraft({ ...EMPTY, ...JSON.parse(raw) });
    } catch {
      // 사생활 보호 모드 등에서 막힐 수 있다. 저장 없이 그냥 쓴다.
    }
    loaded.current = true;
  }, []);

  useEffect(() => {
    if (!loaded.current) return;
    const timer = setTimeout(() => {
      try {
        localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
        setSavedAt(Date.now());
      } catch {
        // 저장이 막히면 표시도 띄우지 않는다
      }
    }, 600);
    return () => clearTimeout(timer);
  }, [draft]);

  const set = (key: FieldName) => (value: string) =>
    setDraft((prev) => ({ ...prev, [key]: value }));

  const ready =
    draft.oneLiner.trim() !== "" &&
    draft.field.trim() !== "" &&
    draft.description.trim() !== "" &&
    draft.problemAndDiff.trim() !== "";

  return (
    <>
      {/* 저장 상태를 아는 건 여기라서 헤더도 이 컴포넌트가 그린다 */}
      <AppHeader current="01" right={<SaveBadge savedAt={savedAt} />} />

      <main className="flex grow flex-col gap-5 px-[120px] py-[34px]">
        <div className="flex flex-col gap-2">
          <p className="font-mono text-xs font-medium tracking-[0.14em] text-muted">
            STEP 01
          </p>
          <h1 className="text-[30px] font-bold leading-[1.36] tracking-[-0.022em]">
            아이디어를 문장으로 적습니다
          </h1>
          <p className="text-[15px] leading-[1.7] text-ink-3">
            여기 적은 내용을 바탕으로 만나볼 사람 다섯 명을 찾아드려요. 별표 표시된 네
            칸만 채우면 시작할 수 있어요.
          </p>
        </div>

        <section className={CARD}>
          <div className="flex items-center gap-2.5">
            <h2 className={EYEBROW}>기본</h2>
            <p className="text-[13px] text-muted">필수 2개</p>
          </div>

          <div className="flex flex-col gap-[7px]">
            <label htmlFor="q1" className={LABEL}>
              아이디어를 한 줄로 소개해주세요 <Required />
            </label>
            <input
              id="q1"
              type="text"
              value={draft.oneLiner}
              onChange={(e) => set("oneLiner")(e.target.value)}
              className={INPUT}
            />
          </div>

          <div className="flex gap-4">
            <div className="flex grow flex-col gap-[7px]">
              <label htmlFor="q5" className={LABEL}>
                사업 분야 <Required />
              </label>
              <select
                id="q5"
                value={draft.field}
                onChange={(e) => set("field")(e.target.value)}
                className={`${INPUT} px-3`}
              >
                <option>IT</option>
                <option>교육</option>
                <option>마케팅/PR</option>
              </select>
            </div>
            <div className="flex grow flex-col gap-[7px]">
              <label htmlFor="q5b" className={LABEL}>
                고객 유형
              </label>
              <select
                id="q5b"
                value={draft.customerType}
                onChange={(e) => set("customerType")(e.target.value)}
                className={`${INPUT} px-3`}
              >
                <option>개인 고객에게 팝니다</option>
                <option>기업·기관에 팝니다</option>
                <option>아직 모르겠어요</option>
              </select>
            </div>
          </div>
        </section>

        <section className={CARD}>
          <div className="flex items-center gap-2.5">
            <h2 className={EYEBROW}>아이디어</h2>
            <p className="text-[13px] text-muted">필수 2개 · 선택 2개</p>
          </div>

          <div className="flex gap-4">
            <div className="flex grow flex-col gap-[7px]">
              <label htmlFor="q3" className={LABEL}>
                어떤 아이디어인가요 <Required />
              </label>
              <textarea
                id="q3"
                rows={4}
                value={draft.description}
                onChange={(e) => set("description")(e.target.value)}
                className={AREA}
              />
            </div>
            <div className="flex grow flex-col gap-[7px]">
              <label htmlFor="q31" className={LABEL}>
                어떤 문제를 풀고, 기존 방식과 뭐가 다른가요 <Required />
              </label>
              <textarea
                id="q31"
                rows={4}
                value={draft.problemAndDiff}
                onChange={(e) => set("problemAndDiff")(e.target.value)}
                placeholder="예) 지금은 주변 사람이나 AI에게 혼자 물어보는데, 한 명씩만 답해서 의견이 갈리는 지점을 볼 수 없습니다."
                className={AREA}
              />
            </div>
          </div>

          {showIdeaExtra ? (
            <div className="flex gap-4">
              <div className="flex grow flex-col gap-[7px]">
                <label htmlFor="qbg" className={LABEL}>
                  어떻게 떠올리셨나요
                </label>
                <textarea
                  id="qbg"
                  rows={3}
                  value={draft.background}
                  onChange={(e) => set("background")(e.target.value)}
                  className={AREA}
                />
              </div>
              <div className="flex grow flex-col gap-[7px]">
                <label htmlFor="qrev" className={LABEL}>
                  어떻게 돈을 버나요
                </label>
                <textarea
                  id="qrev"
                  rows={3}
                  value={draft.revenueModel}
                  onChange={(e) => set("revenueModel")(e.target.value)}
                  className={AREA}
                />
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowIdeaExtra(true)}
              className={`${GHOST_BTN} text-brand`}
            >
              <PlusIcon />
              선택 문항 더 쓰기 — 떠올린 배경, 수익 모델
            </button>
          )}
        </section>

        <section className="flex flex-col gap-[18px] rounded-card border border-card bg-base px-[26px] py-[22px]">
          <div className="flex items-center gap-5">
            <div className="flex grow flex-col gap-[5px]">
              <h2 className="text-base font-semibold">실현 계획 · 자료</h2>
              <p className="text-sm leading-relaxed text-ink-3">
                사업화 계획과 본인 역량은 선택이에요. 이미 만든 기획서나 설문 결과가
                있으면 올려주세요.
              </p>
            </div>
            {/* TODO: 업로드 연결 */}
            <button
              type="button"
              className="flex h-11 shrink-0 items-center gap-[7px] rounded-btn border border-dashed border-btn-border bg-input px-4 text-sm font-medium text-ink-2"
            >
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
                <path d="M12 16V4M7 9l5-5 5 5" />
                <path d="M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3" />
              </svg>
              파일 올리기
            </button>
            <button
              type="button"
              onClick={() => setShowPlanExtra((v) => !v)}
              aria-expanded={showPlanExtra}
              className="h-11 shrink-0 rounded-btn border border-btn-border bg-base px-4 text-sm text-ink-2"
            >
              {showPlanExtra ? "선택 문항 접기" : "선택 문항 열기"}
            </button>
          </div>

          {showPlanExtra && (
            <div className="flex gap-4">
              <div className="flex grow flex-col gap-[7px]">
                <label htmlFor="qplan" className={LABEL}>
                  앞으로 어떻게 만들 계획인가요
                </label>
                <textarea
                  id="qplan"
                  rows={3}
                  value={draft.executionPlan}
                  onChange={(e) => set("executionPlan")(e.target.value)}
                  className={AREA}
                />
              </div>
              <div className="flex grow flex-col gap-[7px]">
                <label htmlFor="qme" className={LABEL}>
                  본인이 잘하는 것
                </label>
                <textarea
                  id="qme"
                  rows={3}
                  value={draft.founderStrength}
                  onChange={(e) => set("founderStrength")(e.target.value)}
                  className={AREA}
                />
              </div>
            </div>
          )}
        </section>

        <div className="mt-auto flex items-center gap-4 pt-2">
          <p className="grow text-sm text-muted">
            작성한 내용은 이 브라우저에 자동으로 저장돼요. 나중에 이어서 써도 괜찮아요.
          </p>
          {/* TODO: AI팀 엔드포인트로 타깃 5명 생성 요청 → /targets */}
          <Link
            href="/targets"
            aria-disabled={!ready}
            tabIndex={ready ? undefined : -1}
            className={`inline-flex h-12 shrink-0 items-center rounded-btn px-[26px] text-[15px] font-semibold ${
              ready
                ? "bg-brand text-white"
                : "pointer-events-none bg-bubble text-muted"
            }`}
          >
            타깃 찾아보기
          </Link>
        </div>
      </main>
    </>
  );
}

/** 헤더 오른쪽에 붙는 저장 표시. 실제로 저장된 뒤에만 뜬다. */
function SaveBadge({ savedAt }: { savedAt: number | null }) {
  if (!savedAt) return null;
  return (
    <p className="flex items-center gap-[7px] text-[13px] text-muted">
      <svg
        width="15"
        height="15"
        viewBox="0 0 24 24"
        fill="none"
        stroke="var(--green-deep)"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M20 6 9 17l-5-5" />
      </svg>
      방금 저장됨
    </p>
  );
}

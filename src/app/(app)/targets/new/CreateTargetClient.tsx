"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { EditableChips } from "@/components/EditableChips";
import { PersonaCard } from "@/components/PersonaCard";
import { saveTarget, useTargets } from "@/lib/targetStore";
import type { Persona } from "@/lib/types";

const LABEL = "w-24 shrink-0 font-mono text-[11px] tracking-[0.06em] text-ink-3";
const FIELD =
  "h-11 rounded-[11px] border border-input-border bg-input px-[13px] text-[15px]";
const AREA =
  "w-full resize-none rounded-[11px] border border-input-border bg-input px-[13px] py-3 text-[15px] leading-[1.75]";
const HINT = "text-xs leading-relaxed text-muted";
const SECONDARY =
  "inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-btn border border-btn-border bg-base px-4 text-sm text-ink-2";

/** 성별은 카드에서 한 글자로 줄여 보여준다. 밝히지 않으면 아예 쓰지 않는다. */
const GENDER_SHORT: Record<string, string | undefined> = {
  여성: "여",
  남성: "남",
  "밝히지 않음": undefined,
};

const GENDER_LONG: Record<string, string> = { 여: "여성", 남: "남성" };

function Required() {
  return <span className="text-conflict-fg">*</span>;
}

/**
 * 02-1. editId 가 있으면 그 사람을 고치는 화면(02 카드의 "고치기"), 없으면 새로 만드는 화면.
 * 고칠 사람은 브라우저 저장소에서 읽는데 서버 렌더에는 추천 원본이 들어간다. 읽은 값이 다르면
 * key 가 바뀌어 폼이 그 값으로 다시 열린다 — 입력 중인 값을 effect 로 덮어쓰지 않기 위해서다.
 */
export function CreateTargetClient({ editId, returnTo = "/targets" }: { editId?: string; returnTo?: string }) {
  const targets = useTargets();
  const editing = editId ? targets.find((p) => p.id === editId) : undefined;
  if (editId && !editing) {
    return (
      <main className="flex grow flex-col items-center justify-center gap-4 px-20">
        <p className="text-[15px] text-ink-3">고칠 사람을 찾지 못했어요. 목록에서 다시 골라 주세요.</p>
        <Link href="/targets" className={SECONDARY}>
          타깃 고르기로 돌아가기
        </Link>
      </main>
    );
  }
  return <TargetForm key={editing ? JSON.stringify(editing) : "new"} initial={editing} returnTo={returnTo} />;
}

function TargetForm({ initial, returnTo }: { initial?: Persona; returnTo: string }) {
  const router = useRouter();
  const [name, setName] = useState(initial?.name ?? "");
  const [age, setAge] = useState(initial?.age ? String(initial.age) : "");
  const [gender, setGender] = useState(
    initial ? (initial.gender ? (GENDER_LONG[initial.gender] ?? "밝히지 않음") : "밝히지 않음") : "여성",
  );
  const [occupation, setOccupation] = useState(initial?.occupation ?? "");
  const [situation, setSituation] = useState(initial?.situation ?? "");
  const [interests, setInterests] = useState<string[]>(initial?.interests ?? []);
  const [worries, setWorries] = useState<string[]>(initial?.worries ?? []);
  const [notes, setNotes] = useState(initial?.notes ?? "");

  const ready = name.trim() !== "" && situation.trim() !== "";

  // 미리보기는 추천 카드와 완전히 같은 컴포넌트를 쓴다. 저장 뒤 모습이 그대로 보여야 한다.
  // 고치는 중이면 카드에만 있는 값(한마디·물어볼 것·고른 이유·색)은 그대로 둔다
  const preview: Persona = {
    ...initial,
    id: initial?.id ?? "preview",
    name: name.trim(),
    age: age.trim() ? Number(age) : undefined,
    gender: GENDER_SHORT[gender],
    occupation: occupation.trim() || undefined,
    situation: situation.trim(),
    interests,
    worries,
    notes: notes.trim() || undefined,
    color: initial?.color ?? 5,
    source: initial?.source ?? "custom",
  };

  const save = () => {
    if (!ready) return;
    saveTarget(preview);
    router.push(returnTo);
  };

  return (
    <>
      <main className="flex grow flex-col gap-5 overflow-hidden px-20 pt-7 pb-6">
        <div className="flex items-end gap-5">
          <div className="flex grow flex-col gap-1.5">
            <Link
              href={returnTo}
              className="flex items-center gap-[7px] font-mono text-[11px] tracking-[0.12em] text-muted"
            >
              <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M19 12H5M11 18l-6-6 6-6" />
              </svg>
              {returnTo === "/compare" ? "한눈에 보기로 돌아가기" : "타깃 고르기로 돌아가기"}
            </Link>
            <h1 className="text-[28px] font-bold leading-[1.38] tracking-[-0.022em]">
              {initial ? `${initial.name}님을 고쳐요` : "만나고 싶은 사람을 직접 만들어보세요"}
            </h1>
            <p className="text-[15px] leading-[1.7] text-ink-3">
              {initial
                ? "추천받은 내용을 내가 아는 고객에 맞게 바꿔요. 고친 내용대로 대화에서 말해요."
                : "이미 아는 고객이 있다면 그 사람을 그대로 넣어도 돼요. 이름과 요즘 상황만 쓰면 나머지는 채워드려요."}
            </p>
          </div>
          {/* TODO: 자료에서 만들기 — 업로드한 녹취·설문에서 뽑아내는 모드 */}
          <div className="flex overflow-hidden rounded-btn border border-btn-border">
            <button
              type="button"
              aria-pressed="true"
              className="h-11 bg-brand px-[18px] text-sm font-semibold text-white"
            >
              직접 쓰기
            </button>
            <button
              type="button"
              aria-pressed="false"
              className="h-11 border-l border-btn-border bg-base px-[18px] text-sm text-ink-2"
            >
              자료에서 만들기
            </button>
          </div>
        </div>

        <div className="flex grow gap-[26px] overflow-hidden">
          <form className="flex w-[800px] shrink-0 flex-col gap-4 overflow-y-auto rounded-card border border-card bg-base px-[26px] py-[22px]">
            <div className="flex items-center gap-3">
              <h2 className="grow text-[16px] font-semibold">어떤 사람인가요</h2>
              {/* TODO: AI팀 엔드포인트 연결 후 빈 칸 채우기 */}
              <button
                type="button"
                className="flex h-[38px] items-center gap-[7px] rounded-[11px] border border-action-border bg-action-bg px-3.5 text-[13px] font-medium text-brand"
              >
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
                  <path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M18 6l-2.5 2.5M8.5 15.5 6 18" />
                </svg>
                나머지 채워주기
              </button>
            </div>

            <div className="flex items-center gap-3.5">
              <label htmlFor="pname" className={LABEL}>
                이름 <Required />
              </label>
              <input
                id="pname"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={`${FIELD} w-[196px]`}
              />
              <label htmlFor="page" className="shrink-0 font-mono text-[11px] tracking-[0.06em] text-ink-3">
                나이
              </label>
              <input
                id="page"
                type="text"
                inputMode="numeric"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                className={`${FIELD} w-21`}
              />
              <label htmlFor="pgen" className="shrink-0 font-mono text-[11px] tracking-[0.06em] text-ink-3">
                성별
              </label>
              <select
                id="pgen"
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className={`${FIELD} w-32 px-[11px]`}
              >
                <option>여성</option>
                <option>남성</option>
                <option>밝히지 않음</option>
              </select>
            </div>

            <div className="flex items-center gap-3.5">
              <label htmlFor="pjob" className={LABEL}>
                하는 일
              </label>
              <input
                id="pjob"
                type="text"
                value={occupation}
                onChange={(e) => setOccupation(e.target.value)}
                className={`${FIELD} grow`}
              />
            </div>

            <div className="flex items-start gap-3.5">
              <label htmlFor="psit" className={`${LABEL} pt-3.5`}>
                요즘 상황 <Required />
              </label>
              <div className="flex grow flex-col gap-1.5">
                <textarea
                  id="psit"
                  rows={3}
                  value={situation}
                  onChange={(e) => setSituation(e.target.value)}
                  className={AREA}
                />
                <p className={HINT}>
                  두세 줄로 적어주세요. 하는 일, 요즘 쫓기는 것, 주변에 누가 있는지까지
                  들어가면 이 사람이 대화에서 자기 얘기를 합니다.
                </p>
              </div>
            </div>

            <hr className="border-0 border-t border-divider" />

            <div className="flex items-start gap-3.5">
              <span className={`${LABEL} pt-2`}>관심사</span>
              <div className="grow">
                <EditableChips
                  items={interests}
                  onChange={setInterests}
                  inputLabel="관심사 추가"
                />
              </div>
            </div>

            <div className="flex items-start gap-3.5">
              <span className={`${LABEL} pt-2`}>걱정</span>
              <div className="flex grow flex-col gap-1.5">
                <EditableChips
                  items={worries}
                  onChange={setWorries}
                  tone="conflict"
                  inputLabel="걱정 추가"
                />
                {/* 걱정이 비면 자기가 듣고 싶은 말만 하는 사람이 된다 */}
                <p className="text-xs leading-relaxed text-conflict-fg">
                  하나는 꼭 적어주세요. 걱정이 없으면 이 사람은 뭘 물어도 좋다고만
                  답합니다.
                </p>
              </div>
            </div>

            <hr className="border-0 border-t border-divider" />

            <div className="flex items-start gap-3.5">
              <label htmlFor="pnotes" className={`${LABEL} pt-3.5`}>
                더 알려줄 것
              </label>
              <div className="flex grow flex-col gap-1.5">
                <textarea
                  id="pnotes"
                  rows={4}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="말투나 성격, 돈·시간 사정, 전에 겪은 일처럼 더 알려주고 싶은 게 있으면 자유롭게 적어주세요."
                  className={AREA}
                />
                <p className={HINT}>
                  여기 적은 내용은 카드에 보이지 않지만, 대화할 때는 그대로 반영돼요.
                </p>
              </div>
            </div>

            <hr className="border-0 border-t border-divider" />

            <div className="flex items-start gap-3.5">
              <span className={`${LABEL} pt-3`}>가진 자료</span>
              <div className="flex grow flex-col gap-2">
                {/* TODO: 업로드 연결 */}
                <button
                  type="button"
                  className="flex h-11 items-center gap-[7px] self-start rounded-btn border border-dashed border-btn-border bg-base px-3.5 text-sm text-ink-2"
                >
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
                    <path d="M12 16V4M7 9l5-5 5 5" />
                    <path d="M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3" />
                  </svg>
                  녹취나 설문 올리기
                </button>
                <p className={HINT}>올린 자료의 내용대로 이 사람이 말해요.</p>
              </div>
            </div>
          </form>

          <aside className="flex grow flex-col gap-3.5 overflow-y-auto">
            <h2 className="font-mono text-[11px] font-semibold tracking-[0.14em] text-muted">
              목록에서는 이렇게 보여요
            </h2>

            {ready ? (
              <PersonaCard persona={preview} readOnly />
            ) : (
              <div className="rounded-card border border-dashed border-btn-border bg-panel px-5 py-8 text-center text-sm leading-relaxed text-ink-3">
                이름과 요즘 상황을 쓰면
                <br />
                여기에 카드가 만들어져요.
              </div>
            )}

            <div className="flex flex-col gap-[7px] rounded-[14px] border border-card bg-panel px-[17px] py-[15px]">
              <h3 className="text-[13px] font-semibold text-ink-2">참고</h3>
              <p className="text-[13px] leading-[1.75] text-ink-3">
                내가 바라는 모습으로 만들면 대화에서 내가 듣고 싶은 말만 나올 수 있어요.
                이 사람이 망설일 이유나 부정적인 이유도 적어주면 좋아요.
              </p>
            </div>
          </aside>
        </div>
      </main>

      <footer className="flex h-[82px] shrink-0 items-center gap-3 border-t border-line bg-base px-20">
        <p className="grow text-sm text-muted">
          {initial
            ? worries.length === 0
              ? "걱정이 비어 있어요. 이대로 저장하면 이 사람은 뭘 물어도 좋다고만 답해요."
              : "저장하면 목록의 카드가 이 내용으로 바뀌어요. 이 브라우저에만 저장돼요."
            : "저장하면 추천받은 다섯 명과 같은 목록에 들어가요. 거기서 골라 대화를 시작하면 돼요."}
        </p>
        <Link href={returnTo} className={`${SECONDARY} h-[46px]`}>
          취소
        </Link>
        <button
          type="button"
          disabled={!ready}
          onClick={save}
          className="h-12 shrink-0 rounded-btn bg-brand px-6 text-[15px] font-semibold text-white disabled:bg-bubble disabled:text-muted"
        >
          {initial ? "고친 내용 저장" : "목록에 추가하기"}
        </button>
      </footer>
    </>
  );
}

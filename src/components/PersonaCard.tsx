import type { Persona, PersonaColor } from "@/lib/types";
import { AttrRow } from "./AttrRow";
import { Chip } from "./Chip";
import { PersonaAvatar } from "./PersonaAvatar";

/** 선택 표시는 색 + 체크 + 버튼 글자 3중으로 한다. 색만으로 알리지 않는다. */
const SELECTED_BORDER: Record<PersonaColor, string> = {
  1: "border-persona-1",
  2: "border-persona-2",
  3: "border-persona-3",
  4: "border-persona-4",
  5: "border-persona-5",
};

const CHECK_BG: Record<PersonaColor, string> = {
  1: "bg-persona-1",
  2: "bg-persona-2",
  3: "bg-persona-3",
  4: "bg-persona-4",
  5: "bg-persona-5",
};

function CheckMark() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

/**
 * 추천 타깃 카드. 02 타깃 화면과 02-1 미리보기가 같은 모양을 쓴다.
 *
 * 분류 배지(핵심/회의적 등)를 노출하지 않는다. 추천 이유는 평범한 한 문장으로만
 * 보여준다. skeptical 플래그는 내부 규칙이라 화면에 드러내지 않는다.
 * (docs/DECISIONS.md 3절, 5절)
 */
export function PersonaCard({
  persona,
  selected = false,
  selectDisabled = false,
  onToggle,
  onEdit,
}: {
  persona: Persona;
  selected?: boolean;
  /** 이미 정원이 차서 더 고를 수 없을 때 */
  selectDisabled?: boolean;
  onToggle?: () => void;
  onEdit?: () => void;
}) {
  const { name, age, gender, occupation, attrs, currentTools, frictions } = persona;
  const meta = [age, gender, occupation].filter(Boolean).join(" · ");

  return (
    <article
      className={`flex flex-col gap-[13px] rounded-card border-2 bg-base px-5 py-[18px] ${
        selected ? SELECTED_BORDER[persona.color] : "border-card"
      }`}
    >
      <header className="flex items-center gap-[11px]">
        <PersonaAvatar name={name} color={persona.color} size="lg" />
        <div className="flex grow flex-col gap-px">
          <h3 className="text-base font-semibold">{name}</h3>
          {meta && <p className="text-xs text-muted">{meta}</p>}
        </div>
        {selected && (
          <span
            className={`flex size-[22px] shrink-0 items-center justify-center rounded-full text-white ${
              CHECK_BG[persona.color]
            }`}
          >
            <CheckMark />
          </span>
        )}
      </header>

      <p className="text-sm leading-[1.7] text-ink-2">{persona.situation}</p>

      {/* 카드끼리 세로로 정렬되어 값이 비교된다 */}
      <div className="flex flex-col gap-[7px]">
        {attrs.map((attr) => (
          <AttrRow key={attr.label} label={attr.label}>
            <span className="font-medium">{attr.value}</span>
          </AttrRow>
        ))}
      </div>

      <hr className="border-0 border-t border-divider" />

      <div className="flex flex-col gap-[9px]">
        <AttrRow label="지금 쓰는 것" align="start">
          <span className="flex flex-wrap gap-[5px]">
            {currentTools.map((tool) => (
              <Chip key={tool}>{tool}</Chip>
            ))}
          </span>
        </AttrRow>
        <AttrRow label="막히는 지점" align="start">
          <span className="flex flex-wrap gap-[5px]">
            {frictions.map((friction) => (
              <Chip key={friction} tone="conflict">
                {friction}
              </Chip>
            ))}
          </span>
        </AttrRow>
      </div>

      {persona.quote && (
        <blockquote className="rounded-chip bg-panel px-3.5 py-[11px] text-sm leading-relaxed text-ink-2">
          &ldquo;{persona.quote}&rdquo;
        </blockquote>
      )}

      <div className="flex flex-col gap-[7px]">
        {persona.checkpoint && (
          <AttrRow label="확인 포인트">{persona.checkpoint}</AttrRow>
        )}
        {persona.reason && (
          <AttrRow label="고른 이유">
            <span className={`font-medium ${selected ? "text-brand" : "text-ink-3"}`}>
              {persona.reason}
            </span>
          </AttrRow>
        )}
      </div>

      <div className="mt-auto flex gap-2 pt-1">
        <button
          type="button"
          onClick={onEdit}
          className="h-11 grow rounded-btn border border-btn-border bg-base text-sm text-ink-2"
        >
          고치기
        </button>
        <button
          type="button"
          onClick={onToggle}
          disabled={!selected && selectDisabled}
          aria-pressed={selected}
          className={
            selected
              ? "h-11 grow rounded-btn bg-brand text-sm font-semibold text-white"
              : "h-11 grow rounded-btn border border-btn-border bg-base text-sm text-ink-2 disabled:text-muted"
          }
        >
          {selected ? "선택됨" : "고르기"}
        </button>
      </div>
    </article>
  );
}

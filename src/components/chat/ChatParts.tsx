import { PersonaAvatar } from "@/components/PersonaAvatar";
import type { PersonaColor } from "@/lib/types";

/**
 * 단체 대화(04)와 발화 대기(07-1)가 함께 쓰는 조각.
 * 페르소나는 색 + 이니셜 + 이름 3중으로 표시한다 (CLAUDE.md 7절).
 */

const NAME_COLOR: Record<PersonaColor, string> = {
  1: "text-persona-1",
  2: "text-persona-2",
  3: "text-persona-3",
  4: "text-persona-4",
  5: "text-persona-5",
};

const DOT_COLOR: Record<PersonaColor, string> = {
  1: "bg-persona-1",
  2: "bg-persona-2",
  3: "bg-persona-3",
  4: "bg-persona-4",
  5: "bg-persona-5",
};

/** ROUND 구분선: 라운드 구조(첫 반응 → 상호 토론 → 자유 질문)를 대화 중에 보여준다. */
export function RoundDivider({ round, label }: { round: number; label: string }) {
  return (
    <div className="flex items-center gap-3" role="separator" aria-label={`라운드 ${round}, ${label}`}>
      <div className="h-px grow bg-line" />
      <p className="font-mono text-[11px] font-medium tracking-[0.12em] text-muted">
        ROUND {String(round).padStart(2, "0")} · {label}
      </p>
      <div className="h-px grow bg-line" />
    </div>
  );
}

/** 페르소나 한 명의 발언 말풍선 */
export function PersonaMessage({
  name,
  color,
  children,
}: {
  name: string;
  color: PersonaColor;
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-[11px]">
      <PersonaAvatar name={name} color={color} />
      <div className="flex max-w-[620px] flex-col gap-[5px]">
        <p className={`text-xs font-semibold ${NAME_COLOR[color]}`}>{name}</p>
        <div className="rounded-[4px_14px_14px_14px] border border-card bg-base px-4 py-[13px] text-[15px] leading-[1.72] text-ink-2">
          {children}
        </div>
      </div>
    </div>
  );
}

/** 지금 말하는 중인 페르소나. 점 세 개가 그 사람 색으로 깜빡인다. */
export function TypingMessage({ name, color }: { name: string; color: PersonaColor }) {
  return (
    <div className="flex gap-[11px]" role="status">
      <PersonaAvatar name={name} color={color} />
      <div className="flex flex-col gap-[5px]">
        <p className={`text-xs font-semibold ${NAME_COLOR[color]}`}>{name}</p>
        <div className="flex items-center gap-1.5 rounded-[4px_14px_14px_14px] border border-card bg-base px-[18px] py-4">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              aria-hidden="true"
              className={`size-[7px] rounded-full ${DOT_COLOR[color]} motion-safe:animate-pulse`}
              style={{ animationDelay: `${i * 0.2}s`, opacity: 1 - i * 0.3 }}
            />
          ))}
          <span className="sr-only">{name}님이 답하는 중</span>
        </div>
      </div>
    </div>
  );
}

/** 다음에 말할 사람 + 여기서 멈추기. 세 명이 순차로 말해 대기가 길어서, 기다리는 동안에도 할 수 있는 일을 남긴다. */
export function NextSpeaker({
  name,
  color,
  onStop,
}: {
  name: string;
  color: PersonaColor;
  onStop?: () => void;
}) {
  return (
    <div className="flex items-center gap-2.5 pt-0.5">
      <div className="flex h-9 items-center gap-[9px] rounded-full bg-bubble px-3.5">
        <span className="font-mono text-[10px] font-semibold tracking-[0.12em] text-muted">다음</span>
        <span className="flex items-center gap-1.5">
          <PersonaAvatar name={name} color={color} size="sm" />
          <span className="text-[13px] text-ink-2">{name}</span>
        </span>
      </div>
      <button
        type="button"
        onClick={onStop}
        className="h-11 rounded-full border border-btn-border bg-base px-3.5 text-[13px] text-ink-3"
      >
        여기서 멈추기
      </button>
    </div>
  );
}

/**
 * 하단 입력창. 페르소나가 말하는 동안에도 질문은 적어둘 수 있게 입력은 열어두고 보내기만 막는다.
 */
export function ChatComposer({
  value,
  onChange,
  onSend,
  sending = false,
  placeholder = "세 명에게 묻고 싶은 것을 적어주세요",
}: {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  /** 페르소나가 말하는 중이면 보내기를 막는다 */
  sending?: boolean;
  placeholder?: string;
}) {
  const disabled = sending || !value.trim();
  return (
    <form
      className="flex w-[880px] items-center gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        if (!disabled) onSend();
      }}
    >
      <label htmlFor="say" className="sr-only">
        하고 싶은 말
      </label>
      <input
        id="say"
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-[50px] grow rounded-[14px] border border-input-border bg-base px-[18px] text-[15px] text-ink placeholder:text-muted"
      />
      <button
        type="submit"
        aria-label={sending ? "답하는 중이라 아직 보낼 수 없어요" : "보내기"}
        disabled={disabled}
        className="flex size-[50px] shrink-0 items-center justify-center rounded-[14px] bg-brand disabled:cursor-not-allowed disabled:bg-btn-border"
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="var(--bg-base)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M12 19V5M5 12l7-7 7 7" />
        </svg>
      </button>
    </form>
  );
}

import Link from "next/link";

export const STEPS = [
  { no: "01", label: "아이디어", href: "/new" },
  { no: "02", label: "타깃", href: "/targets" },
  { no: "03", label: "한눈에 보기", href: "/compare" },
  { no: "04", label: "대화", href: "/chat" },
  { no: "05", label: "리포트", href: "/report" },
] as const;

export type StepNo = (typeof STEPS)[number]["no"];

/** 과녁과 원탁은 위에서 보면 같은 모양이다. 초록 점은 항상 정북. */
export function Logo({ size = 26 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <circle cx="16" cy="16" r="6.5" stroke="var(--brand)" strokeWidth="2.2" />
      <circle cx="16" cy="16" r="2.4" fill="var(--brand)" />
      <circle cx="16" cy="4" r="1.9" fill="var(--green-deep)" />
      <circle cx="27.4" cy="12.3" r="1.9" fill="var(--brand)" />
      <circle cx="23.1" cy="25.7" r="1.9" fill="var(--brand)" />
      <circle cx="8.9" cy="25.7" r="1.9" fill="var(--brand)" />
      <circle cx="4.6" cy="12.3" r="1.9" fill="var(--brand)" />
    </svg>
  );
}

export function AppHeader({
  current,
  right,
}: {
  current?: StepNo;
  right?: React.ReactNode;
}) {
  return (
    <header className="flex h-16 shrink-0 items-center gap-9 border-b border-line bg-base px-8">
      <Link href="/" className="flex items-center gap-2.5">
        <Logo />
        <span className="text-[17px] font-semibold tracking-[-0.01em]">TargetTable</span>
      </Link>

      <nav aria-label="진행 단계" className="flex grow items-center gap-1.5">
        {STEPS.map((step) => {
          const active = step.no === current;
          return (
            <Link
              key={step.no}
              href={step.href}
              aria-current={active ? "step" : undefined}
              className={`flex items-center gap-2 rounded-[9px] px-3 py-1.5 ${
                active ? "border border-action-border bg-action-bg" : ""
              }`}
            >
              <span
                className={`font-mono text-[11px] tracking-[0.12em] ${
                  active ? "font-semibold text-brand" : "text-muted"
                }`}
              >
                {step.no}
              </span>
              <span
                className={`text-[13px] ${
                  active ? "font-semibold text-brand" : "text-ink-3"
                }`}
              >
                {step.label}
              </span>
            </Link>
          );
        })}
      </nav>

      {right}
    </header>
  );
}

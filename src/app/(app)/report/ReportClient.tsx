"use client";

import Link from "next/link";
import { Fragment, useEffect, useState } from "react";
import { PersonaAvatar } from "@/components/PersonaAvatar";
import { ReportSkeleton } from "@/components/states/Skeleton";
import { ProgressPanel } from "@/components/states/StepProgress";
import { useStepTicker } from "@/components/states/useStepTicker";
import { MOCK_PERSONAS } from "@/lib/mock";
import type { Issue, Persona, Report, Stance } from "@/lib/types";

const STANCE: Record<Stance, { label: string; className: string }> = {
  agree: { label: "찬성", className: "bg-agree-bg text-agree-fg" },
  conditional: { label: "조건부", className: "bg-conflict-bg text-conflict-fg" },
  // 반대는 색상뿐 아니라 명도로도 구분한다 (DECISIONS.md 05)
  disagree: { label: "반대", className: "bg-ink-2 text-white" },
  hold: { label: "보류", className: "bg-bubble text-ink-3" },
};

/**
 * 쟁점 판정 뱃지 문구를 입장에서 계산한다. 하드코딩하면 데이터가 바뀔 때 거짓말을 한다.
 * 찬성·조건부를 한쪽, 반대를 다른 쪽으로 세서 "2 : 1 갈림"처럼 쓴다.
 */
function verdictBadge(issue: Issue) {
  if (issue.verdict === "unresolved") return { label: "결론 안 남", className: "bg-bubble text-ink-3" };
  if (issue.verdict === "consensus") {
    const all = issue.stances.length === 3 ? "셋 다" : "모두";
    return { label: `${all} 동의`, className: "bg-agree-bg text-agree-fg" };
  }
  const yes = issue.stances.filter((s) => s.stance === "agree" || s.stance === "conditional").length;
  const no = issue.stances.length - yes;
  return { label: `${Math.max(yes, no)} : ${Math.min(yes, no)} 갈림`, className: "bg-conflict-bg text-conflict-fg" };
}

/** 해석 문장의 **굵게** 를 강조로 그린다 */
function Emphasis({ text }: { text: string }) {
  return (
    <>
      {text.split(/\*\*(.+?)\*\*/).map((part, i) =>
        i % 2 ? (
          <strong key={i} className="font-semibold">
            {part}
          </strong>
        ) : (
          <Fragment key={i}>{part}</Fragment>
        ),
      )}
    </>
  );
}

const STEPS = ["오간 말 모으기", "쟁점으로 묶기", "물어볼 질문 뽑기"];

/** 헤더 오른쪽 "내려받기" — 리포트를 화면과 같은 순서의 텍스트 파일로 저장한다 */
export function ReportDownloadButton({ report }: { report: Report }) {
  const download = () => {
    const people = report.personaIds
      .map((id) => MOCK_PERSONAS.find((p) => p.id === id))
      .filter((p): p is Persona => !!p);
    const name = (id?: string) => people.find((p) => p.id === id)?.name ?? "세 명";
    const blob = new Blob([reportText(report, people, name)], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `soul-report-${report.createdAt.slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };
  return (
    <button type="button" onClick={download} className="h-11 rounded-btn border border-btn-border bg-base px-4 text-sm text-ink-2">
      내려받기
    </button>
  );
}

/** 내려받기용 텍스트. 화면과 같은 순서로 쓴다. */
function reportText(r: Report, people: Persona[], name: (id?: string) => string) {
  const lines = [
    "분석 리포트",
    `${r.createdAt.slice(0, 10)} · ${people.map((p) => p.name).join(" · ")} · ${r.rounds} ROUNDS · 발언 ${r.messageCount}`,
    "",
    `결론: ${r.headline}`,
    r.summary,
    "",
    "쟁점",
    ...r.issues.flatMap((issue, i) => [
      `${String(i + 1).padStart(2, "0")} ${issue.title} — ${verdictBadge(issue).label}`,
      ...issue.stances.map((s) => `  - ${name(s.personaId)} (${STANCE[s.stance].label}): ${s.reason}`),
      `  해석: ${issue.reading.replace(/\*\*/g, "")}`,
    ]),
    "",
    "새로 얻은 인사이트",
    ...r.insights.map((x, i) => `${String(i + 1).padStart(2, "0")} ${x.title} — ${x.body} (${x.source})`),
    "",
    "확인하지 못한 것",
    ...r.openQuestions.map((q) => `- ${q}`),
    "",
    "실제로 만나서 물어볼 것",
    "누구를",
    ...r.meetWho.map((w) => `- ${w}`),
    "무엇을",
    ...r.meetQuestions.map((q, i) => `${i + 1}. ${q}`),
    "",
    "AI 페르소나와 나눈 대화를 정리한 것이다. 실제 고객의 답변이 아니다.",
  ];
  return lines.join("\n");
}

/**
 * 시안: design/screens/05-report.html (+ 들어올 때 07-2 리포트 로딩)
 * TODO: 04 대화가 끝난 기록으로 리포트를 만드는 엔드포인트가 붙으면 MOCK_REPORT 대신 그 결과를 받는다.
 */
export function ReportClient({ report }: { report: Report }) {
  const people = report.personaIds
    .map((id) => MOCK_PERSONAS.find((p) => p.id === id))
    .filter((p): p is Persona => !!p);
  const byId = (id?: string) => people.find((p) => p.id === id);
  const name = (id?: string) => byId(id)?.name ?? "세 명";

  // 리포트를 만드는 동안 07-2 를 보여준다. 지금은 더미라 단계를 한 번 돌고 나서 연다.
  const current = useStepTicker(STEPS.length, 1100);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setReady(true), 1100 * STEPS.length);
    return () => clearTimeout(timer);
  }, []);
  const [copied, setCopied] = useState<"idle" | "done" | "fail">("idle");

  if (!ready) {
    return (
      <main className="flex grow flex-col gap-6 px-[110px] py-9">
        <ProgressPanel
          step="STEP 05"
          title="대화를 정리하고 있어요"
          description={`발언 ${report.messageCount}개를 읽고 쟁점별로 묶는 중이에요.`}
          steps={STEPS}
          current={current}
        />
        <ReportSkeleton />
      </main>
    );
  }

  const split = report.issues.filter((i) => i.verdict === "split").length;
  const stats = [
    { label: "다룬 쟁점", value: report.issues.length, className: "text-ink" },
    { label: "의견이 갈린 쟁점", value: split, className: "text-conflict-fg" },
    { label: "입장이 바뀐 횟수", value: report.stanceChanges.length, className: "text-agree-fg" },
    { label: "새로 나온 이야기", value: report.insights.length, className: "text-ink" },
  ];

  const copyQuestions = async () => {
    try {
      await navigator.clipboard.writeText(report.meetQuestions.map((q, i) => `${i + 1}. ${q}`).join("\n"));
      setCopied("done");
    } catch {
      setCopied("fail");
    }
    setTimeout(() => setCopied("idle"), 1800);
  };

  const changedNames = [...new Set(report.stanceChanges.map((c) => name(c.personaId)))];

  return (
    <main className="flex grow flex-col gap-[26px] px-[110px] pb-8 pt-9">
      <section className="flex flex-col gap-3.5" aria-labelledby="report-title">
        <p className="flex items-center gap-3.5 font-mono text-[11px] tracking-[0.1em] text-muted">
          <span>{report.createdAt.slice(0, 10).replace(/-/g, ".")}</span>
          <span aria-hidden="true">·</span>
          <span>{people.map((p) => p.name).join(" · ")}</span>
          <span aria-hidden="true">·</span>
          <span>
            {report.rounds} ROUNDS · 발언 {report.messageCount}
          </span>
        </p>
        <h1 id="report-title" className="text-[30px] font-bold leading-[1.36] tracking-[-0.024em]">
          분석 리포트
        </h1>
        <div className="flex flex-col gap-3.5 rounded-card border border-card bg-base px-7 py-6">
          <p className="font-mono text-[11px] font-semibold tracking-[0.14em] text-brand">결론</p>
          <p className="max-w-[1000px] text-xl font-semibold leading-[1.6] tracking-[-0.015em]">{report.headline}</p>
          <p className="max-w-[1000px] text-base leading-[1.8] text-ink-2">{report.summary}</p>
        </div>
      </section>

      <dl className="flex gap-4">
        {stats.map((s) => (
          <div key={s.label} className="flex flex-1 flex-col-reverse gap-1.5 rounded-card border border-card bg-base px-[18px] py-4">
            <dd className={`font-mono text-2xl font-semibold ${s.className}`}>{s.value}</dd>
            <dt className="text-xs text-muted">{s.label}</dt>
          </div>
        ))}
      </dl>

      <section className="flex flex-col gap-3.5">
        <div className="flex items-baseline gap-3">
          <h2 className="text-xl font-semibold tracking-[-0.015em]">쟁점</h2>
          <span className="text-sm text-muted">대화에서 논의가 오간 순서</span>
        </div>
        {report.issues.map((issue, i) => {
          const badge = verdictBadge(issue);
          return (
            <article key={issue.id} className="flex flex-col gap-3.5 rounded-card border border-card bg-base px-6 py-5">
              <div className="flex items-center gap-3">
                <span className="font-mono text-xs font-semibold tracking-[0.1em] text-muted">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="grow text-[17px] font-semibold">{issue.title}</h3>
                <span className={`rounded-[9px] px-[11px] py-1.5 font-mono text-[11px] font-semibold tracking-[0.1em] ${badge.className}`}>
                  {badge.label}
                </span>
              </div>
              <ul className="flex flex-col gap-[9px]">
                {issue.stances.map((s) => {
                  const p = byId(s.personaId);
                  return (
                    <li key={s.personaId} className="flex items-center gap-3">
                      {p && <PersonaAvatar name={p.name} color={p.color} size="sm" />}
                      <span className="w-[62px] shrink-0 text-sm font-medium">{name(s.personaId)}</span>
                      <span
                        className={`w-[70px] shrink-0 rounded-[9px] py-[5px] text-center text-xs font-semibold ${STANCE[s.stance].className}`}
                      >
                        {STANCE[s.stance].label}
                      </span>
                      <span className="grow text-sm leading-[1.65] text-ink-2">{s.reason}</span>
                    </li>
                  );
                })}
              </ul>
              <div className="flex gap-3 rounded-[11px] bg-panel px-4 py-[13px]">
                <span className="shrink-0 pt-[3px] font-mono text-[11px] font-semibold tracking-[0.1em] text-muted">해석</span>
                <p className="grow text-sm leading-[1.75] text-ink-2">
                  <Emphasis text={issue.reading} />
                </p>
              </div>
            </article>
          );
        })}
      </section>

      <section className="flex flex-col gap-3.5">
        <div className="flex items-baseline gap-3">
          <h2 className="text-xl font-semibold tracking-[-0.015em]">새로 얻은 인사이트</h2>
          <span className="text-sm text-muted">아이디어를 적을 때는 없던 것</span>
        </div>
        <ol className="flex flex-col gap-5 rounded-card border border-card bg-base px-[26px] py-[22px]">
          {report.insights.map((x, i) => (
            <li key={x.title} className="flex items-start gap-4">
              <span className="shrink-0 pt-[3px] font-mono text-xs font-semibold tracking-[0.1em] text-brand">
                {String(i + 1).padStart(2, "0")}
              </span>
              <div className="flex grow flex-col gap-[5px]">
                <h3 className="text-base font-semibold">{x.title}</h3>
                <p className="max-w-[940px] text-sm leading-[1.8] text-ink-2">{x.body}</p>
                <p className="font-mono text-[11px] tracking-[0.06em] text-muted">{x.source}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <div className="grid grid-cols-3 gap-[18px]">
        <section className="flex flex-col gap-3 rounded-card border border-card bg-base px-[22px] py-5">
          <h2 className="text-base font-semibold">입장이 바뀐 지점</h2>
          {report.stanceChanges.length === 0 ? (
            <p className="text-sm leading-[1.75] text-ink-2">입장을 바꾼 사람은 없었다.</p>
          ) : (
            <>
              {report.stanceChanges.map((c) => (
                <div key={c.personaId + c.to} className="flex flex-wrap items-center gap-[7px]">
                  <span className="rounded-[9px] bg-bubble px-2.5 py-[5px] text-xs text-ink-3">{c.from}</span>
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="var(--text-muted)"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    role="img"
                    aria-label="에서"
                  >
                    <path d="M5 12h14M13 6l6 6-6 6" />
                  </svg>
                  <span className="rounded-[9px] bg-agree-bg px-2.5 py-[5px] text-xs font-semibold text-agree-fg">{c.to}</span>
                </div>
              ))}
              <p className="text-sm leading-[1.75] text-ink-2">
                {changedNames.join(", ")}
                {changedNames.length === people.length ? "이 모두" : "만"} 입장을 바꿨다. 이유를 밝히고 바뀐 경우라 기록했다.
                분위기에 맞춰 동의한 것은 넣지 않았다.
              </p>
              {report.stanceChanges[0].quote && (
                <blockquote className="rounded-[11px] bg-panel px-3.5 py-[11px] text-[13px] leading-[1.7] text-ink-2">
                  “{report.stanceChanges[0].quote}”
                </blockquote>
              )}
            </>
          )}
        </section>

        <section className="flex flex-col gap-3 rounded-card border border-card bg-base px-[22px] py-5">
          <h2 className="text-base font-semibold">이어서 물어볼 지점</h2>
          <p className="text-sm leading-[1.75] text-ink-2">이번 대화에서 새로 생긴 질문이다. 누르면 그 자리에서 이어서 물어본다.</p>
          <div className="flex flex-col gap-2">
            {report.followUps.map((f) => {
              const p = byId(f.personaId);
              const ask = p ? `@${p.name} ${f.question}` : f.question;
              return (
                <Link
                  key={f.question}
                  href={`/chat?ask=${encodeURIComponent(ask)}`}
                  className="flex items-start gap-[9px] rounded-[11px] border border-action-border bg-action-bg px-[13px] py-[11px] text-left"
                >
                  {p ? (
                    <PersonaAvatar name={p.name} color={p.color} size="sm" />
                  ) : (
                    <span
                      aria-hidden="true"
                      className="flex size-6 shrink-0 items-center justify-center rounded-full bg-brand text-[10px] font-semibold text-white"
                    >
                      셋
                    </span>
                  )}
                  <span className="grow text-[13px] leading-[1.6] text-brand">
                    <span className="sr-only">{p ? `${p.name}에게: ` : "세 명 모두에게: "}</span>
                    {f.question}
                  </span>
                </Link>
              );
            })}
          </div>
        </section>

        <section className="flex flex-col gap-3 rounded-card border border-card bg-base px-[22px] py-5">
          <h2 className="text-base font-semibold">확인하지 못한 것</h2>
          <ul className="flex flex-col gap-[9px]">
            {report.openQuestions.map((q) => (
              <li key={q} className="flex items-start gap-[9px]">
                <span aria-hidden="true" className="mt-2 size-[5px] shrink-0 rounded-full bg-conflict-fg" />
                <span className="text-sm leading-[1.65] text-ink-2">{q}</span>
              </li>
            ))}
          </ul>
          <p className="text-[13px] leading-[1.65] text-muted">대화만으로는 답이 나오지 않는 항목이다. 아래 질문으로 이어진다.</p>
        </section>
      </div>

      <section className="flex gap-11 rounded-card bg-dark-bg px-[30px] py-[26px]">
        <div className="flex w-[300px] shrink-0 flex-col gap-3">
          <h2 className="text-[19px] font-semibold text-dark-ink">실제로 만나서 물어볼 것</h2>
          <p className="text-sm leading-[1.75] text-dark-ink-2">위 대화는 사람의 답이 아니다. 여기 남은 질문을 실제로 물어야 검증이 된다.</p>
          <div className="mt-1 flex flex-col gap-[7px]">
            <h3 className="font-mono text-[10px] font-semibold tracking-[0.12em] text-brand-on-dark">누구를</h3>
            <ul>
              {report.meetWho.map((w) => (
                <li key={w} className="text-sm leading-[1.9] text-dark-ink-2">
                  · {w}
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="flex grow flex-col gap-3">
          <h3 className="font-mono text-[10px] font-semibold tracking-[0.12em] text-brand-on-dark">무엇을</h3>
          <ol className="flex flex-col gap-3">
            {report.meetQuestions.map((q, i) => (
              <li key={q} className="flex items-start gap-[11px]">
                <span className="shrink-0 pt-[3px] font-mono text-[11px] font-semibold tracking-[0.08em] text-brand-on-dark">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="grow text-sm leading-[1.7] text-dark-ink">{q}</span>
              </li>
            ))}
          </ol>
          <button
            type="button"
            onClick={copyQuestions}
            className="mt-1.5 h-11 self-start rounded-btn bg-green-pure px-[18px] text-sm font-semibold text-ink"
          >
            {copied === "done" ? "복사했어요" : copied === "fail" ? "복사하지 못했어요" : "질문 복사하기"}
          </button>
          <span className="sr-only" role="status">
            {copied === "done" ? "질문을 복사했어요" : copied === "fail" ? "복사하지 못했어요" : ""}
          </span>
        </div>
      </section>

      <div className="mt-auto flex items-center gap-3">
        <p className="grow text-[13px] leading-[1.65] text-muted">
          AI 페르소나 {people.length === 3 ? "세 명" : `${people.length}명`}과 나눈 대화를 정리한 것이다. 실제 고객의 답변이 아니다.
        </p>
        <Link href="/chat" className="inline-flex h-[46px] items-center rounded-btn border border-btn-border bg-base px-[18px] text-sm text-ink-2">
          대화 이어가기
        </Link>
        <Link
          href="/targets"
          className="inline-flex h-[46px] items-center rounded-btn bg-brand px-5 text-sm font-semibold text-white hover:bg-brand-hover"
        >
          다른 타깃과 다시 해보기
        </Link>
      </div>
    </main>
  );
}

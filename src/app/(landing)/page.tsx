import Link from "next/link";
import { Logo } from "@/components/AppHeader";

/**
 * 랜딩 (플레이스홀더).
 * 실제 랜딩은 design/ 의 랜딩 시안을 따라 별도로 만든다.
 * 섹션 순서: 네비 → 히어로(실제 단체대화 데모) → 근거 띠 → 문제 → 작동 방식
 *          → 멀티 페르소나 → 비교표 → 기관 도입 → FAQ → 최종 CTA → 푸터
 */
export default function LandingPage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-[1440px] flex-col justify-center px-20">
      <div className="flex items-center gap-2.5">
        <Logo size={32} />
        <span className="text-xl font-semibold tracking-[-0.01em]">TargetTable</span>
      </div>

      <h1 className="mt-8 text-[52px] font-bold leading-[1.24] tracking-[-0.028em]">
        첫 고객 인터뷰 전에,
        <br />
        리허설부터.
      </h1>

      <p className="mt-6 max-w-[560px] text-[19px] leading-[1.72] text-ink-3">
        아이디어를 적으면 타깃 후보를 찾아주고, 그 타깃들이 한 방에 모여
        서로의 말을 들으며 답합니다. 인터뷰를 대신하지 않습니다. 앞뒤를 채웁니다.
      </p>

      <div className="mt-10 flex items-center gap-3">
        <Link
          href="/new"
          className="flex items-center rounded-btn bg-brand px-6 text-[15px] font-semibold text-white"
        >
          첫 검증 무료로 시작
        </Link>
        <Link
          href="/new"
          className="flex items-center rounded-btn border border-btn-border px-6 text-[15px] text-ink-2"
        >
          작동 방식 90초 보기
        </Link>
      </div>

      <p className="mt-5 text-sm text-muted">
        신용카드 없이 시작 · 아이디어 1건 무료 검증
      </p>
    </main>
  );
}

"use client";

import { PersonaCardSkeleton } from "@/components/states/Skeleton";
import { ProgressPanel } from "@/components/states/StepProgress";
import { useStepTicker } from "@/components/states/useStepTicker";

/** 상황을 먼저 만들고 그다음 사람을 만든다 (DECISIONS.md 02). 단계 이름도 그 순서를 따른다. */
const STEPS = ["적어주신 내용 읽기", "문제를 겪을 상황 찾기", "상황마다 사람 만들기"];
const CANDIDATES = 5;

/** 시안: design/screens/07-loading-targets.html — 01 → 02 사이 대기 */
export function LoadingTargetsClient() {
  const current = useStepTicker(STEPS.length, 2500, 1);

  return (
    <main className="flex grow flex-col gap-[22px] px-20 py-[30px]">
      <ProgressPanel
        step="STEP 02"
        title="타깃 후보를 찾고 있어요"
        description="30초쯤 걸려요. 창을 닫아도 계속 진행되고, 다 되면 여기로 돌아오면 돼요."
        steps={STEPS}
        current={current}
      />
      <div className="grid grid-cols-3 gap-[18px]">
        {Array.from({ length: CANDIDATES }, (_, i) => (
          <PersonaCardSkeleton key={i} />
        ))}
      </div>
    </main>
  );
}

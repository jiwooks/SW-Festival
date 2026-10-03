"use client";

import { ReportSkeleton } from "@/components/states/Skeleton";
import { ProgressPanel } from "@/components/states/StepProgress";
import { useStepTicker } from "@/components/states/useStepTicker";

const STEPS = ["오간 말 모으기", "쟁점으로 묶기", "물어볼 질문 뽑기"];

/** 시안: design/screens/07-2-loading-report.html — 대화를 마치고 리포트를 만드는 동안 */
export function LoadingReportClient({ utterances }: { utterances: number }) {
  const current = useStepTicker(STEPS.length, 2500, 1);

  return (
    <main className="flex grow flex-col gap-6 px-[110px] py-9">
      <ProgressPanel
        step="STEP 05"
        title="대화를 정리하고 있어요"
        description={`발언 ${utterances}개를 읽고 쟁점별로 묶는 중이에요. 1분쯤 걸려요.`}
        steps={STEPS}
        current={current}
      />
      <ReportSkeleton />
    </main>
  );
}

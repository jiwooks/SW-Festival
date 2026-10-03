import type { Metadata } from "next";
import { AppHeader } from "@/components/AppHeader";
import { LoadingReportClient } from "./LoadingReportClient";

export const metadata: Metadata = { title: "리포트 만드는 중" };

/** 시안: design/screens/07-2-loading-report.html — 시안과 같은 장면(발언 9개) */
export default function Page() {
  return (
    <>
      <AppHeader current="05" />
      <LoadingReportClient utterances={9} />
    </>
  );
}

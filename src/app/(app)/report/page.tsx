import type { Metadata } from "next";
import { AppHeader } from "@/components/AppHeader";
import { MOCK_REPORT } from "@/lib/mock";
import { ReportClient, ReportDownloadButton } from "./ReportClient";

export const metadata: Metadata = { title: "리포트" };

/** 시안: design/screens/05-report.html — 들어오면 07-2 로딩을 잠깐 보여준 뒤 리포트를 연다 */
export default function Page() {
  return (
    <>
      <AppHeader current="05" right={<ReportDownloadButton report={MOCK_REPORT} />} />
      <ReportClient report={MOCK_REPORT} />
    </>
  );
}

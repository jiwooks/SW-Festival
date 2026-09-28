import { NextRequest } from "next/server";

export const runtime = "nodejs";

/**
 * 페르소나 발화 스트리밍 엔드포인트 (스텁).
 *
 * 모델은 AI팀이 고르고 서빙한다 (EXAONE / Qwen 계열).
 * 웹팀은 모델을 직접 부르지 않고, AI팀이 준 엔드포인트 하나만 여기서 호출한다.
 * 키는 서버 환경변수로만 읽고 클라이언트로 내려보내지 않는다.
 *
 * 단체 대화는 3명이 순차로 말하기 때문에 전체 응답을 기다리면 체감 대기가 길다.
 * 반드시 토큰 단위로 흘려보낸다.
 *
 * LLM_BASE_URL 이 비어 있으면 스텁 응답을 돌려준다.
 * AI팀 엔드포인트가 정해지기 전에도 화면 작업을 막지 않기 위해서다.
 *
 * TODO: AI팀 엔드포인트 연결. 확인할 것 — 요청·응답 형식(OpenAI 호환 여부),
 *       스트리밍 형식, 순차 발화를 누가 돌리는지. CLAUDE.md 기술 스택 절 참고.
 */
export async function POST(req: NextRequest) {
  const body = (await req.json()) as {
    roomId?: string;
    personaIds?: string[];
    message?: string;
  };

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      const send = (data: unknown) =>
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));

      send({
        type: "notice",
        text: process.env.LLM_BASE_URL
          ? "LLM_BASE_URL 은 설정됐지만 아직 연결하지 않았습니다."
          : "스텁 응답입니다. AI팀 엔드포인트를 연결하세요.",
        received: { roomId: body.roomId, personaIds: body.personaIds },
      });
      send({ type: "done" });
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}

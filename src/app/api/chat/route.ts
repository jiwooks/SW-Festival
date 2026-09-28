import { NextRequest } from "next/server";

export const runtime = "nodejs";

/**
 * 페르소나 발화 스트리밍 엔드포인트 (스텁).
 *
 * 여기서만 LLM 을 호출한다. API 키는 서버 환경변수로만 읽고,
 * 클라이언트로 내려보내지 않는다.
 *
 * 단체 대화는 3명이 순차로 말하기 때문에 전체 응답을 기다리면 체감 대기가 길다.
 * 반드시 토큰 단위로 흘려보낸다.
 *
 * TODO: 오케스트레이터 연결 — 누가 언제 말할지, 라운드 관리, 쟁점 태깅.
 *       쟁점은 리포트 생성 때 한 번에 뽑지 말고 대화 중에 미리 태깅해 둔다.
 */
export async function POST(req: NextRequest) {
  const body = (await req.json()) as {
    roomId?: string;
    personaIds?: string[];
    message?: string;
  };

  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json(
      { error: "ANTHROPIC_API_KEY 가 설정되지 않았습니다. .env.local 을 확인하세요." },
      { status: 500 },
    );
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      const send = (data: unknown) =>
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));

      send({
        type: "notice",
        text: "스텁 응답입니다. 오케스트레이터를 연결하세요.",
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

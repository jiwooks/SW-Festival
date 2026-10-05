import { NextRequest } from "next/server";
import { MOCK_CHAT_SCRIPT, MOCK_DM_SCRIPT, MOCK_DM_SUGGESTIONS, MOCK_PERSONAS } from "@/lib/mock";
import type { ChatEvent, ChatRequest, Persona } from "@/lib/types";

export const runtime = "nodejs";

/**
 * 페르소나 발화 스트리밍 엔드포인트.
 *
 * 여기서만 LLM 을 호출한다. 키는 서버 환경변수로만 읽고 클라이언트로 내려보내지 않는다.
 * 어떤 모델인지는 가정하지 않는다 — AI팀이 정한 엔드포인트(LLM_BASE_URL)를 부를 뿐이다.
 *
 * 단체 대화는 3명이 순차로 말하기 때문에 전체 응답을 기다리면 체감 대기가 길다.
 * 반드시 토큰 단위로 흘려보낸다. 이벤트 형식은 lib/types.ts 의 ChatEvent.
 *
 * 지금은 스텁 오케스트레이터다: 누가 언제 말할지·라운드·걸리는 지점 태깅을 여기서 정하고,
 * 대사는 mock.ts 대본(시안과 같은 장면)이나 카드 내용으로 만든 문장을 글자 단위로 흘린다.
 *
 * TODO: LLM_BASE_URL 이 정해지면 line() 대신 AI팀 엔드포인트를 부르고, 받은 토큰을
 *       그대로 token 이벤트로 넘긴다. 순서·라운드·concern 태깅 규칙은 이 파일에 남긴다.
 *
 * 개발용: /api/chat?simulateError=1 이면 두 번째 사람이 말하는 중에 끊는다 (08 에러 확인용).
 */
export async function POST(req: NextRequest) {
  // 페이지를 떠나거나 멈추기로 보내는 도중에 끊긴 요청은 본문이 비어 있다 — 오류로 띄우지 않고 끝낸다
  let body: ChatRequest;
  try {
    body = (await req.json()) as ChatRequest;
  } catch {
    return new Response(null, { status: 400 });
  }
  const simulateError = req.nextUrl.searchParams.get("simulateError") === "1";
  // 고친 카드·직접 만든 사람은 브라우저가 보낸 카드를 쓴다. 없으면 추천 원본
  const personas = body.personaIds
    .map((id) => body.personas?.find((p) => p.id === id) ?? MOCK_PERSONAS.find((p) => p.id === id))
    .filter((p): p is Persona => Boolean(p));

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: ChatEvent) => {
        if (!req.signal.aborted) controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
      };
      try {
        if (body.kind === "round" && body.roomType === "group") send({ type: "round", round: body.round });
        const order = speakingOrder(body, personas);
        for (let i = 0; i < order.length; i++) {
          if (req.signal.aborted) return;
          const persona = order[i];
          send({ type: "start", personaId: persona.id, nextId: order[i + 1]?.id });
          await wait(700); // 생각하는 시간 — 화면에서는 "답하는 중" 점 세 개
          const { text, concern } = line(body, persona, order);
          for (let c = 0; c < text.length; c += 2) {
            if (req.signal.aborted) return;
            if (simulateError && i === 1 && c > text.length / 2) {
              send({ type: "error", personaId: persona.id, message: "연결이 끊겼어요" });
              return;
            }
            send({ type: "token", personaId: persona.id, text: text.slice(c, c + 2) });
            await wait(28);
          }
          send({ type: "end", personaId: persona.id, concern });
          await wait(300);
        }
        if (body.roomType === "dm") {
          const items = MOCK_DM_SUGGESTIONS[order[0]?.id] ?? [];
          if (items.length) send({ type: "suggestions", items });
        }
        send({ type: "done" });
      } finally {
        if (!req.signal.aborted) controller.close();
      }
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

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * 누가 어떤 순서로 말할지.
 * - 1:1: 그 사람만
 * - @지목: 지목된 사람만 (DECISIONS.md 04 — `@이름`으로 지목)
 * - 1라운드: 고른 순서대로 한 번씩
 * - 그 뒤: 지금까지 가장 많이 걸려한 사람이 먼저 — 반대가 먼저 나와야 토론이 된다
 */
function speakingOrder(body: ChatRequest, personas: Persona[]) {
  if (body.roomType === "dm") return personas.slice(0, 1);
  if (body.kind === "message" && body.targetId) return personas.filter((p) => p.id === body.targetId);
  if (body.round <= 1 && body.kind === "round") return personas;
  const concerns = (id: string) => body.history.filter((m) => m.speakerId === id && m.concern).length;
  return [...personas].sort((a, b) => concerns(b.id) - concerns(a.id));
}

/** 대본에 있으면 대본, 없으면 카드(관심사·걱정)로 문장을 만든다. 카드에 없는 경험은 지어내지 않는다. */
function line(body: ChatRequest, persona: Persona, order: Persona[]): { text: string; concern: boolean } {
  const spoken = body.history.filter((m) => m.speakerId === persona.id);
  if (body.roomType === "dm") {
    const text = (MOCK_DM_SCRIPT[persona.id] ?? [])[spoken.length];
    if (text) return { text, concern: false };
    return stubReply(persona, body.message ?? "", spoken.length);
  }
  if (body.kind === "round") {
    const scripted = MOCK_CHAT_SCRIPT[body.round]?.[persona.id];
    if (scripted && !body.history.some((m) => m.text === scripted.text)) return scripted;
  }
  const other = order.find((p) => p.id !== persona.id);
  return stubReply(persona, body.message ?? "", spoken.length, other);
}

/** "박민수" → "민수님" */
const call = (name: string) => (name.length === 3 ? `${name.slice(1)}님` : `${name}님`);

function stubReply(persona: Persona, message: string, n: number, other?: Persona) {
  const worry = persona.worries[n % persona.worries.length] ?? "잘 모르겠는 부분";
  const interest = persona.interests[n % persona.interests.length] ?? "제 상황";
  // 과거 행동을 물으면 카드의 '요즘 상황'에서 답한다 — 카드에 없는 경험을 지어내지 않기 위해
  if (/최근|지난번|마지막|써본|해보셨|그만|어떻게 하셨|써보다/.test(message)) {
    const sentences = persona.situation.split(/(?<=[.다요])\s+/);
    return { text: `제 경우엔요, ${sentences[Math.min(n + 1, sentences.length - 1)]}`, concern: false };
  }
  if (message) {
    return {
      text: `제 입장에선 '${worry}' 부분이 제일 걸려요. '${interest}' 쪽이 확실해지면 다시 생각해볼 수 있어요.`,
      concern: true,
    };
  }
  return other
    ? { text: `${call(other.name)} 얘기도 맞는데, 저는 여전히 '${worry}' 부분이 마음에 걸려요.`, concern: true }
    : { text: `저는 '${interest}' 쪽이 더 궁금해요.`, concern: false };
}

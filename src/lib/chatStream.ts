import type { ChatEvent, ChatRequest } from "./types";

/**
 * /api/chat 을 부르고 SSE 이벤트를 하나씩 onEvent 로 넘긴다.
 * signal 로 끊으면("여기서 멈추기", 1:1 열기) 조용히 끝난다 — 에러로 보지 않는다.
 * 연결 자체가 실패하거나 서버가 error 이벤트를 보내면 onEvent({type:"error"}) 로 알린다.
 */
export async function streamChat(
  request: ChatRequest,
  onEvent: (event: ChatEvent) => void,
  signal: AbortSignal,
  url = "/api/chat",
) {
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
      signal,
    });
    if (!res.ok || !res.body) {
      onEvent({ type: "error", message: `응답을 받지 못했어요 (${res.status})` });
      return;
    }
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let finished = false;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const chunks = buffer.split("\n\n");
      buffer = chunks.pop() ?? "";
      for (const chunk of chunks) {
        const data = chunk.replace(/^data: /, "").trim();
        if (!data) continue;
        const event = JSON.parse(data) as ChatEvent;
        if (event.type === "done" || event.type === "error") finished = true;
        onEvent(event);
      }
    }
    // done 없이 끊겼으면 중간에 연결이 끊긴 것
    if (!finished && !signal.aborted) onEvent({ type: "error", message: "연결이 끊겼어요" });
  } catch (err) {
    if (signal.aborted) return;
    onEvent({ type: "error", message: err instanceof Error ? err.message : "연결이 끊겼어요" });
  }
}

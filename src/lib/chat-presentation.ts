import { normalize } from "./korean-text";

type Participant = { id: string; name: string };
/** Reader-facing chat prose only. Never use this for source quotations or export. */
export function displayChatText(text: string, speakerId?: string, participants: Participant[] = [], utteranceOwners: Record<string, string> = {}): string {
  // The bounded MVP has p1..p3 and at most two reasoning rules. Restrict cleanup
  // to these recognizable IDs, including the model's doubled-r spelling.
  const rule = "r{1,2}[12]";
  const reference = "(?:p[1-3]\\s*:\\s*)?" + rule;
  const list = reference + "(?:\\s*[,，/·]\\s*" + reference + ")*";
  const parenthesized = new RegExp("[ \\t]?(?:\\(\\s*" + list + "\\s*\\)|\\[\\s*" + list + "\\s*\\]|（\\s*" + list + "\\s*）)", "g");
  const standalone = new RegExp("(?<![\\p{L}\\p{N}_:])(?:(p[1-3])\\s*:\\s*)?" + rule + "(?=$|[^\\p{L}\\p{N}_]|(?:은|는|을|를|의|에|에서|으로|로|과|와|이|가|도|만|부터|처럼|까지|에게|이라는|이라고|이라면|입니다|이며|이고)(?=$|[^\\p{L}\\p{N}_]))", "gu");
  const literal = /(```[\s\S]*?(?:```|$)|`[^`\r\n]*`|https?:\/\/[^\s<>]+|"[^"\r\n]*"|'[^'\r\n]*'|“[^”\r\n]*”|‘[^’\r\n]*’)/g;
  const prose = text.split(literal).map((part, index) => index % 2 ? part : part
    .replace(parenthesized, "")
    .replace(standalone, (_match, owner?: string) => {
      if (!owner || owner === speakerId) return "제 판단 조건";
      const participant = participants.find(person => person.id === owner);
      return participant ? `${participant.name}님의 판단 조건` : "다른 참여자의 판단 조건";
    })
    .replace(/판단 조건[ \t]*에[ \t]*따르면/g, "판단 조건에 따르면")
    .replace(/\[([^\]\r\n]+)\]/g, (match, id: string) => utteranceOwners[id] ? `[${utteranceOwners[id]}님 발언]` : match)
  ).join("");
  return normalize(prose);
}

type TurnRef = { id: string; persona_id: string; phase: string; thread_id: string | null };
type ThreadRef = { id: string; interaction?: "auto" | "direct" | "interactive" | null };

/**
 * 1:1 패널에 보일 발화: 이 사람에게 지정해서 물은 질문의 답만. 단체 질문의 답은 빼고 단체 대화에만 남긴다.
 * interaction이 없는 예전 기록은 그 질문에 이 사람 혼자 답했을 때만 1:1로 본다.
 */
export function directTurns<T extends TurnRef>(transcript: T[], threads: ThreadRef[], personaId: string): T[] {
  const group = transcript.filter(turn => turn.phase === "group");
  const isDirect = (threadId: string | null) => {
    const thread = threads.find(item => item.id === threadId);
    if (!thread) return false;
    if (thread.interaction) return thread.interaction === "direct";
    const speakers = new Set(group.filter(turn => turn.thread_id === thread.id).map(turn => turn.persona_id));
    return speakers.size === 1 && speakers.has(personaId);
  };
  return group.filter(turn => turn.persona_id === personaId && isDirect(turn.thread_id));
}

export function chatInteractionLabel(interaction?: "auto" | "direct" | "interactive"): string {
  return interaction === "direct" ? "지정 답변" : "모두 · 상호 대화";
}

/** 제품 전체에서 쓰는 도메인 타입. 화면과 API가 같은 모양을 쓴다. */

/** 아이디어 입력 (모두의 창업 지원서 문항 기반) */
export interface Idea {
  id: string;
  /** Q1 한 줄 소개 — 필수 */
  oneLiner: string;
  /** Q5 사업 분야 — 필수 */
  field: string;
  /** 개인 고객 / 기업·기관 / 미정 — 타깃 추천의 축이 달라진다 */
  customerType: "b2c" | "b2b" | "unknown";
  /** Q3 어떤 아이디어인가 — 필수 */
  description: string;
  /** Q3-1 문제와 차별점 — 필수 */
  problemAndDiff: string;
  /** 이하 선택 */
  background?: string;
  revenueModel?: string;
  executionPlan?: string;
  founderStrength?: string;
  fileIds?: string[];
  createdAt: string;
  updatedAt: string;
}

/** 아이디어를 읽은 결과. 타깃을 만들기 전에 사용자가 확인·수정한다. */
export interface IdeaSummary {
  problem: string;
  solution: string;
  likelyAudience: string;
}

export type PersonaSource = "recommended" | "edited" | "custom";

/**
 * 페르소나 성향 원형 5개 — Moore 기술 수용 주기 (혁신가·비전가·실용주의·보수주의·회의주의).
 * 웹 카드는 "구체적인 사람", 원형은 "무엇을 보고 써볼지 정하는가"(말투·판단 기준)다.
 * 화면에는 안 보이고 아바타 표정에 쓴다. 모델 쪽에서 말투를 고를 때도 쓸 수 있다.
 */
export type Archetype = "innovator" | "visionary" | "pragmatist" | "conservative" | "skeptic";

/** 페르소나 색은 5개 슬롯만 쓴다. 파랑·초록은 브랜드색이라 쓰지 않는다. */
export type PersonaColor = 1 | 2 | 3 | 4 | 5;

export interface Persona {
  id: string;
  name: string;
  age?: number;
  gender?: string;
  occupation?: string;
  /**
   * 요즘 상황 — 2~3줄. 카드에서 이 사람이 누구인지 잡아주는 본문이다.
   * 직업·마감·주변 사람처럼 구체적인 정황이 들어가야 대화가 뻔해지지 않는다.
   */
  situation: string;
  /** 관심사 — 짧은 키워드. 설득 포인트가 여기서 나온다 */
  interests: string[];
  /**
   * 걱정되는 점 — 짧은 키워드.
   * 비어 있으면 대화에서 반대할 근거가 없어 무조건 호의적으로 답한다.
   * 최소 1개는 채운다.
   */
  worries: string[];
  /**
   * 사용자가 자유롭게 덧붙인 설명. 카드에는 보이지 않고 대화에만 반영된다.
   * 말투·성격·돈과 시간 사정·과거에 겪은 일 등.
   */
  notes?: string;
  /** 이 사람이 할 법한 말 한 줄. 추천 카드에만 쓰고, 직접 만들 때는 입력받지 않는다 */
  quote?: string;
  /** 이 사람에게 물어볼 것 — 카드에는 '물어볼 것'으로 표시한다 */
  checkpoint?: string;
  /** 왜 추천했는지 (AI 판단. 사용자가 만든 경우 비어 있다) */
  reason?: string;
  color: PersonaColor;
  source: PersonaSource;
  fileIds?: string[];
  /**
   * 화면에는 노출하지 않는 내부 플래그.
   * 추천 5명 중 최소 1명은 true 여야 한다 — 전원이 호의적으로 답하는 것을 막는다.
   */
  skeptical?: boolean;
  /**
   * 화면에는 노출하지 않는 내부 값. 이 사람이 말할 때 쓸 모델 원형.
   * 비어 있으면(직접 만든 사람 등) 모델 쪽에서 카드 내용으로 고른다.
   * skeptical: true 인데 비어 있으면 skeptic 으로 본다.
   */
  archetype?: Archetype;
}

export type RoomType = "group" | "dm";

export interface Room {
  id: string;
  type: RoomType;
  personaIds: string[];
}

export interface Message {
  id: string;
  roomId: string;
  /** persona id 또는 "user" */
  speakerId: string;
  text: string;
  round: number;
  createdAt: string;
  /**
   * 이 발언이 걸리는 지점(걱정·반대)을 드러냈는지. 오케스트레이터가 대화 중에 태깅한다.
   * 리포트 생성 때 한 번에 뽑으면 자주 틀려서 미리 표시해 둔다 (DECISIONS.md 7절).
   * 04 의 "○○님이 가장 많이 걸려했어요"와 04-1 의 "단체 대화에서 걸려한 부분"이 이걸 센다.
   */
  concern?: boolean;
}

/** 라운드 구조: 첫 반응 → 상호 토론 → 자유 질문 (DECISIONS.md 04) */
export const ROUND_LABELS: Record<number, string> = {
  1: "처음 들은 생각",
  2: "서로 이야기 나누기",
  3: "자유 질문",
};
export const roundLabel = (round: number) => ROUND_LABELS[Math.min(round, 3)];

/**
 * POST /api/chat 요청. AI팀 엔드포인트가 붙어도 웹 쪽 계약은 이 모양을 유지한다.
 * - kind "round": 다음 라운드를 진행한다 (첫 진입 = 1라운드, "이어서 더 듣기" = 다음 라운드)
 * - kind "message": 사용자가 말했다. targetId 가 있으면(@이름) 그 사람만 답한다
 * 1:1(dm)은 단체방과 컨텍스트를 나눈다 — history 에 그 방 메시지만 보낸다 (DECISIONS.md 04)
 */
export interface ChatRequest {
  roomType: RoomType;
  kind: "round" | "message";
  personaIds: string[];
  round: number;
  history: Pick<Message, "speakerId" | "text" | "round" | "concern">[];
  message?: string;
  targetId?: string;
  /** 이 방 사람들의 카드 전체. 고친 카드·직접 만든 사람은 브라우저에만 있어서 함께 보낸다 */
  personas?: Persona[];
  /** 01 에서 입력한 아이디어. 첫 라운드 피칭과 1:1 맥락에 쓴다 */
  idea?: ChatIdea;
}

/** 대화에 넘기는 아이디어 — 01 입력값 그대로(문자열) */
export type ChatIdea = Partial<
  Record<"oneLiner" | "field" | "description" | "problemAndDiff" | "background" | "revenueModel", string>
>;

/**
 * /api/chat 이 SSE(`data: {...}\n\n`)로 흘려보내는 이벤트.
 * 페르소나는 순차로 말하므로 한 사람씩 start → token… → end 가 이어진다.
 */
export type ChatEvent =
  | { type: "round"; round: number }
  /** 지금 말할 사람과 그 다음 사람 (07-1 "다음" 표시용) */
  | { type: "start"; personaId: string; nextId?: string }
  | { type: "token"; personaId: string; text: string }
  | { type: "end"; personaId: string; concern: boolean }
  /** 1:1 끝에 "이어서 물어볼 만한 것" */
  | { type: "suggestions"; items: string[] }
  | { type: "error"; personaId?: string; message: string }
  | { type: "done" };

/** 리포트는 쟁점 단위로 정리한다. */
export type Stance = "agree" | "conditional" | "disagree" | "hold";

export interface IssueStance {
  personaId: string;
  stance: Stance;
  /** 그렇게 말한 이유 한 줄 */
  reason: string;
}

export type IssueVerdict = "split" | "consensus" | "unresolved";

export interface Issue {
  id: string;
  title: string;
  verdict: IssueVerdict;
  stances: IssueStance[];
  /** 왜 이렇게 갈렸는지 해석 */
  reading: string;
}

/** 이유를 밝히고 바뀐 경우만 기록한다. 분위기에 맞춘 동조는 넣지 않는다. */
export interface StanceChange {
  personaId: string;
  from: string;
  to: string;
  trigger: string;
  quote?: string;
}

/** 아이디어 입력에 없던, 대화에서 새로 나온 이야기 */
export interface Insight {
  title: string;
  /** 평서체. 무엇이 새로 보였고 왜 의미가 있는지 */
  body: string;
  /** 근거 위치 — 예: "쟁점 02 · 정서윤" */
  source: string;
}

/** 이 대화를 더 파는 질문. 누르면 04 로 돌아가 바로 묻는다 ("실제로 만나서 물어볼 것"과 다르다) */
export interface FollowUp {
  /** 특정 사람에게 묻는다. 비우면 세 명 모두에게 */
  personaId?: string;
  question: string;
}

/**
 * 리포트 순서 (CLAUDE.md 9절 — 05): 결론 → 숫자 → 쟁점 → 새로 얻은 인사이트
 * → 입장이 바뀐 지점 / 이어서 물어볼 지점 / 확인하지 못한 것 → 실제로 만나서 물어볼 것.
 * 본문은 평서체(~했다/~이다)로 쓴다. 숫자는 화면에서 이 데이터로 센다.
 */
export interface Report {
  id: string;
  ideaId: string;
  personaIds: string[];
  /** 결론 한 문장 (제목 자리에 넣지 않는다. 제목은 "분석 리포트") */
  headline: string;
  summary: string;
  rounds: number;
  messageCount: number;
  issues: Issue[];
  stanceChanges: StanceChange[];
  insights: Insight[];
  followUps: FollowUp[];
  /** 이번 대화로는 알 수 없는 것. 비우지 않는다 — 전부 답한 척하는 리포트가 가장 의심받는다 */
  openQuestions: string[];
  /** 실제로 만나서 물어볼 것 — 누구를 */
  meetWho: string[];
  /** 실제로 만나서 물어볼 것 — 무엇을. 과거 행동을 묻는 질문 */
  meetQuestions: string[];
  createdAt: string;
}

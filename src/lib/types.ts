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
}

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

export interface Report {
  id: string;
  ideaId: string;
  headline: string;
  summary: string;
  rounds: number;
  messageCount: number;
  issues: Issue[];
  stanceChanges: StanceChange[];
  /** 아이디어 입력에 없던, 대화에서 새로 나온 이야기 */
  surprises: string[];
  /** 이번 대화로는 알 수 없는 것. 비우지 않는다. */
  openQuestions: string[];
  createdAt: string;
}

import type { IdeaSummary, Persona } from "./types";

/**
 * 화면 개발용 더미 데이터. LLM 을 붙이기 전까지 이걸로 화면을 돌린다.
 * 내용은 design/screens/02-targets.html 시안과 같다.
 *
 * 추천 5명 중 최소 1명은 skeptical: true 여야 한다.
 * 이게 없으면 LLM 특성상 전원이 "좋은데요?"라고 답한다. (docs/DECISIONS.md 3절)
 */

export const MOCK_IDEA_SUMMARY: IdeaSummary = {
  problem: "첫 인터뷰가 부담돼 혼자 판단하고 넘어감",
  solution: "여러 타깃과 한 번에 대화해 갈리는 지점 보기",
  likelyAudience: "아직 아무도 못 만나본 예비창업자",
};

export const MOCK_PERSONAS: Persona[] = [
  {
    id: "p1",
    name: "박민수",
    age: 24,
    gender: "남",
    occupation: "대학 4학년, 예비창업자",
    situation:
      "지원서 마감이 3주 남았는데 고객 인터뷰를 한 번도 못 해봤어요. 어디서부터 시작해야 할지 몰라 혼자 판단하고 넘어가는 중이에요.",
    attrs: [
      { label: "인터뷰 경험", value: "0회" },
      { label: "급한 정도", value: "지원서 마감 3주 전" },
      { label: "쓸 수 있는 돈", value: "월 1만 원까지" },
    ],
    currentTools: ["친구 2~3명", "AI 챗봇"],
    frictions: ["누굴 만날지 모름", "연락할 데가 없음"],
    quote: "누구한테 연락해야 할지부터 막막해요",
    checkpoint: "인터뷰 0회인 사람이 첫발을 뗄 수 있을까",
    reason: "1차 고객에 가장 가까움",
    color: 1,
    source: "recommended",
  },
  {
    id: "p2",
    name: "정서윤",
    age: 27,
    gender: "여",
    occupation: "두 번째 창업 준비 중",
    situation:
      "첫 창업 때 인터뷰를 30명 넘게 하면서 배운 게 컸어요. 그래서 지금도 사람을 직접 만나는 방식을 고집하는 편이에요.",
    attrs: [
      { label: "인터뷰 경험", value: "30명 이상" },
      { label: "급한 정도", value: "급하지 않음 · 직접 함" },
      { label: "쓸 수 있는 돈", value: "금액보다 근거가 되는지" },
    ],
    currentTools: ["커뮤니티 모집", "대면 인터뷰"],
    frictions: ["시간이 많이 듦", "AI 답은 근거 안 됨"],
    quote: "말하다 멈칫하는 순간, 그건 AI가 못 주죠",
    checkpoint: "대체하지 않아도 쓸 이유가 남을까",
    reason: "가장 세게 반대할 사람",
    color: 2,
    source: "recommended",
    skeptical: true,
  },
  {
    id: "p3",
    name: "김태현",
    age: 41,
    gender: "남",
    occupation: "대학 창업지원단 담당자",
    situation:
      "한 기수에 40팀을 멘토링하는데, 대부분 타깃을 못 잡고 옵니다. 일일이 붙잡고 봐줄 시간은 없어요.",
    attrs: [
      { label: "인터뷰 경험", value: "본인은 없음 · 팀에 시킴" },
      { label: "급한 정도", value: "다음 기수 시작 전" },
      { label: "쓸 수 있는 돈", value: "기관 예산 · 연 1회 편성" },
    ],
    currentTools: ["사전 과제 배포", "단체 멘토링"],
    frictions: ["절반이 안 해옴", "40팀 다 못 봄"],
    quote: "과제를 내줘도 절반은 안 해옵니다",
    checkpoint: "기관이 팀 단위로 비용을 낼까",
    reason: "쓰는 사람과 돈 내는 사람이 다름",
    color: 4,
    source: "recommended",
  },
  {
    id: "p4",
    name: "한지우",
    age: 22,
    gender: "여",
    occupation: "교내 창업동아리",
    situation:
      "아이디어가 계속 바뀌는 단계예요. 이게 사업이 될지부터 아직 확신이 없어서 크게 투자하기는 조심스러워요.",
    attrs: [
      { label: "인터뷰 경험", value: "0회" },
      { label: "급한 정도", value: "급하지 않음 · 마감 없음" },
      { label: "쓸 수 있는 돈", value: "무료 범위 안에서만" },
    ],
    currentTools: ["동아리 피드백"],
    frictions: ["아이디어가 계속 바뀜", "복잡하면 안 씀"],
    quote: "아직 사업이 될지도 모르겠어서요",
    checkpoint: "안 급한 사람도 돈 낼 이유가 생길까",
    reason: "무료와 유료 사이 경계",
    color: 3,
    source: "recommended",
  },
  {
    id: "p5",
    name: "오현석",
    age: 33,
    gender: "남",
    occupation: "사내 신사업 담당",
    situation:
      "회사에서 새 서비스 기획을 맡았는데, 사용자 조사를 할 예산도 시간도 따로 없습니다.",
    attrs: [
      { label: "인터뷰 경험", value: "0회" },
      { label: "급한 정도", value: "분기 내 기획안 제출" },
      { label: "쓸 수 있는 돈", value: "회사 결제 필요" },
    ],
    currentTools: ["팀 회의에서 추정"],
    frictions: ["조사 예산 없음", "외부 업로드 꺼림"],
    quote: "회사 기획안을 밖에 올리는 게 걸려요",
    checkpoint: "창업자 밖에도 같은 문제가 있을까",
    reason: "시장이 더 넓은지 보려고",
    color: 5,
    source: "recommended",
  },
];

/** 시안에서 처음부터 골라져 있는 세 명 */
export const MOCK_PRESELECTED = ["p1", "p2", "p3"];

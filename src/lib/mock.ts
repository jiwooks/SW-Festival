import type { IdeaSummary, Persona } from "./types";

/**
 * 화면 개발용 더미 데이터. AI팀 엔드포인트가 붙기 전까지 이걸로 화면을 돌린다.
 * 내용은 design/screens/02-targets.html 시안과 같다.
 *
 * 추천 5명 중 최소 1명은 skeptical: true 여야 한다.
 * 이게 없으면 LLM 특성상 전원이 "좋은데요?"라고 답한다. (CLAUDE.md 절대 원칙 4)
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
      "창업 동아리에서 만난 팀원 둘과 아이디어를 굴리고 있어요. 지원서 마감이 3주 남았는데 고객 인터뷰는 한 번도 못 해봤습니다. 누구를 만나야 할지부터 모르겠고, 모르는 사람한테 연락할 엄두도 안 나요. 결국 친구들한테 물어보고 혼자 판단해서 넘어갑니다.",
    interests: ["지원서 통과", "빨리 확인하기", "무료로 써보기"],
    worries: ["누굴 만나야 할지 모름", "연락할 데가 없음"],
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
      "첫 창업 때 고객 인터뷰를 30명 넘게 했어요. 말보다 표정에서 배운 게 커서, 지금도 사람을 직접 만나는 방식을 고집합니다. 팀원들에게도 커뮤니티에서 직접 모집해 만나라고 시켜요. 시간은 오래 걸리지만 이게 맞다고 생각해요.",
    interests: ["진짜 반응", "근거로 쓸 수 있는지", "투자자 설득"],
    worries: ["AI 답은 근거가 안 됨", "시간만 쓰게 될까봐"],
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
      "한 기수에 40팀을 멘토링합니다. 대부분 타깃을 못 잡고 오는데 일일이 붙잡고 봐줄 시간이 없어요. 사전 과제를 내줘도 절반은 그냥 안 해옵니다. 외부 멘토를 부르면 사람마다 말이 달라서 팀들이 더 헷갈려 하고요.",
    interests: ["팀 전체 관리", "멘토링 전 준비", "기관 예산으로 집행"],
    worries: ["절반이 안 해옴", "예산은 연초에 정해짐"],
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
      "동아리에서 매주 아이디어를 하나씩 던져보는 중이에요. 이번 달에만 방향이 세 번 바뀌었습니다. 아직 이게 사업이 될지부터 확신이 없어서 돈이나 시간을 크게 쓰기는 조심스러워요. 복잡해 보이면 그냥 안 열어봅니다.",
    interests: ["가볍게 시작하기", "무료 범위", "동아리에서 공유"],
    worries: ["아이디어가 계속 바뀜", "복잡하면 안 씀"],
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
      "회사에서 새 서비스 기획을 맡았는데 사용자 조사를 할 예산도 시간도 따로 없습니다. 결국 팀 회의에서 각자 짐작으로 타깃을 정하고 넘어가요. 기획안을 올리면 왜 이 타깃이냐는 질문이 꼭 나오는데 답할 근거가 없습니다. 사내 자료를 외부에 올리는 것도 걸리고요.",
    interests: ["기획안 근거", "빠른 검토", "사내 보안"],
    worries: ["조사 예산 없음", "외부 업로드가 걸림"],
    quote: "회사 기획안을 밖에 올리는 게 걸려요",
    checkpoint: "창업자 밖에도 같은 문제가 있을까",
    reason: "시장이 더 넓은지 보려고",
    color: 5,
    source: "recommended",
  },
];

/** 시안에서 처음부터 골라져 있는 세 명 */
export const MOCK_PRESELECTED = ["p1", "p2", "p3"];

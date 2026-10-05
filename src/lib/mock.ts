import type { IdeaSummary, Persona, Report } from "./types";

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
    archetype: "innovator",
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
    archetype: "skeptic",
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
    archetype: "pragmatist",
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
    archetype: "conservative",
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
    archetype: "visionary",
  },
];

/** 시안에서 처음부터 골라져 있는 세 명 */
export const MOCK_PRESELECTED = ["p1", "p2", "p3"];

/**
 * 스텁 대화 대본. LLM_BASE_URL 이 비어 있을 때 /api/chat 이 이걸 흘려보낸다.
 * 1·2라운드는 design/screens/04-chat.html 시안 대사와 같다. concern 은 걸리는 지점을 드러낸 발언.
 * 대본에 없는 사람·라운드·질문은 stubReply 가 카드 내용(관심사·걱정)으로 만든다.
 */
export const MOCK_CHAT_SCRIPT: Record<number, Record<string, { text: string; concern: boolean }>> = {
  1: {
    p1: { text: "솔직히 저는 이거 바로 써볼 것 같아요. 지금 제일 막막한 게 누구를 만나야 하는지거든요.", concern: false },
    p2: { text: "저는 반대예요. 제가 인터뷰에서 얻은 건 답변 내용보다 말하다 멈칫하는 순간이었어요. 그건 AI가 못 주죠.", concern: true },
    p3: { text: "저는 좀 다릅니다. 40팀을 봐야 해서 애초에 인터뷰를 다 시킬 수가 없어요. 아예 안 하는 것보다는 낫습니다.", concern: false },
  },
  2: {
    p2: { text: "태현님 말씀은 이해가 가요. 근데 그렇게 모은 걸 투자자한테 내밀 수 있냐고 하면 저는 아니라고 봅니다.", concern: true },
    p3: { text: "서윤님 말이 맞는 부분도 있어요. 근데 저희는 투자자보다 멘토링 전에 팀들이 뭘 준비해 오는지가 더 급합니다.", concern: false },
    p1: { text: "서윤님 말도 맞는데, 저처럼 아직 아무도 못 만나본 사람한테는 인터뷰 가기 전 연습용으로라도 있는 게 낫다고 봐요.", concern: false },
  },
};

/** 1:1 스텁 대사 (04-1 시안). 대본이 떨어지면 stubReply 로 만든다. */
export const MOCK_DM_SCRIPT: Record<string, string[]> = {
  p2: [
    '첫 창업 때요, 다들 말로는 좋다고 했거든요. 근데 "얼마면 쓰시겠어요" 물으면 다들 2초씩 멈췄어요. 그때 알았죠, 아 이건 안 되는구나.',
    '아, 그거라면 얘기가 다르죠. 끝나고 "이것도 물어볼걸" 하는 게 항상 있거든요.',
  ],
};

/** 1:1 "이어서 물어볼 만한 것" 스텁 */
export const MOCK_DM_SUGGESTIONS: Record<string, string[]> = {
  p2: [
    "그 2초 멈칫하는 걸 여기서도 알 수 있으면, 생각이 달라지세요?",
    "인터뷰 끝나고 다시 물어보고 싶었던 건 보통 어떤 거였어요?",
  ],
};

/**
 * 입력창 위 "물어볼 질문". 과거 행동을 묻는다 — "이거 쓰실 건가요?" 같은 가정형은
 * 누구나 "네"라고 답해서 검증이 안 된다 (DECISIONS.md 04).
 */
export const MOCK_QUESTION_POOL = [
  "가장 최근에 이 문제 겪었을 때 어떻게 하셨어요?",
  "지금 쓰는 방법에서 제일 불편한 건 뭐예요?",
  "이 문제 때문에 돈이나 시간을 써본 적 있으세요?",
  "비슷한 걸 써보다 그만둔 적 있으세요? 왜 그만두셨어요?",
  "이 문제를 마지막으로 누구한테 털어놨어요?",
  "지난번에 이걸 해결하려고 뭘 찾아보셨어요?",
];

/**
 * 05 리포트 더미. 내용은 design/screens/05-report.html 시안과 같다.
 * 해석(reading) 안의 **굵게** 는 화면에서 강조로 그린다.
 */
export const MOCK_REPORT: Report = {
  id: "r1",
  ideaId: "i1",
  personaIds: ["p1", "p2", "p3"],
  headline: "인터뷰를 대신한다고 하면 셋 다 선을 그었고, 전후에 쓰는 도구라고 하자 셋 다 쓰겠다고 했다.",
  summary:
    "가장 크게 갈린 건 AI 대화를 검증 근거로 인정할 수 있느냐였다. 인터뷰 경험이 많은 쪽은 반대했고, 팀을 여럿 관리하는 쪽은 찬성했다. 서비스 자체보다 각자 처한 상황이 입장을 갈랐고, 설명을 바꾸자 갈등이 대부분 풀렸다. 다만 돈 이야기를 먼저 꺼낸 사람은 없었다.",
  rounds: 2,
  messageCount: 9,
  issues: [
    {
      id: "i1",
      title: "AI와 나눈 대화를 검증 근거로 쓸 수 있나",
      verdict: "split",
      stances: [
        { personaId: "p1", stance: "conditional", reason: "근거까지는 아니어도 인터뷰 전에 질문을 정리하는 용도로는 충분하다고 봤다." },
        { personaId: "p2", stance: "disagree", reason: "인터뷰에서 얻는 건 답변 내용이 아니라 반응이라, AI 답으로는 팀도 투자자도 설득할 수 없다고 했다." },
        { personaId: "p3", stance: "agree", reason: "40팀을 다 볼 수 없는 입장이라, 완벽하지 않아도 아무것도 없이 오는 것보다 낫다고 봤다." },
      ],
      reading:
        "반대한 쪽은 인터뷰 경험이 많고, 찬성한 쪽은 본인이 직접 해본 적이 없다. 서비스를 어떻게 보느냐가 아니라 **지금 무엇이 가능한 위치인가**가 입장을 갈랐다.",
    },
    {
      id: "i2",
      title: "인터뷰를 대신하지 않고 전후에 쓰는 도구라면",
      verdict: "consensus",
      stances: [
        { personaId: "p1", stance: "agree", reason: "인터뷰를 잡기 전 준비 단계로 맞다고 했다." },
        { personaId: "p2", stance: "agree", reason: "반대에서 돌아선 지점. 인터뷰가 끝난 뒤에는 사람을 다시 부를 수 없다는 게 이유였다." },
        { personaId: "p3", stance: "agree", reason: "멘토링 전에 내주는 사전 과제 자리에 넣을 수 있겠다고 했다." },
      ],
      reading:
        "같은 기능인데 설명 한 줄을 바꾸자 셋 다 찬성으로 돌아섰다. 지금은 만드는 것보다 **뭐라고 부르는지**가 더 크게 작용하는 구간이다.",
    },
    {
      id: "i3",
      title: "돈을 낼 만한가",
      verdict: "unresolved",
      stances: [
        { personaId: "p1", stance: "conditional", reason: "월 1만 원을 넘으면 고민된다고 했다. 금액은 말했지만 낼 이유는 말하지 않았다." },
        { personaId: "p2", stance: "conditional", reason: "금액보다 결과를 근거로 쓸 수 있느냐를 따졌다. 액수는 끝까지 언급하지 않았다." },
        { personaId: "p3", stance: "hold", reason: "예산이 연초에 한 번 정해져 쓰고 싶어도 다음 기수까지 기다려야 한다고 했다." },
      ],
      reading: "셋 다 쓰겠다고 했지만 **돈 이야기를 먼저 꺼낸 사람은 없다.** 여기까지가 이 대화로 알 수 있는 범위다.",
    },
  ],
  stanceChanges: [
    {
      personaId: "p2",
      from: "인터뷰를 대신한다",
      to: "끝나고 다시 물어본다",
      trigger: "인터뷰가 끝난 뒤에는 사람을 다시 부를 수 없다",
      quote: "끝나고 '이것도 물어볼걸' 하는 게 항상 있거든요. 그 용도라면 저도 씁니다.",
    },
  ],
  insights: [
    {
      title: "설명 한 줄이 수용을 가른다",
      body: '같은 기능인데 "인터뷰를 대신한다"에서 "인터뷰 전후에 쓴다"로 바꾸자 가장 강하게 반대하던 사람이 찬성으로 돌아섰다. 지금 막는 건 기능이 아니라 설명이다.',
      source: "쟁점 02 · 정서윤",
    },
    {
      title: "기관은 검증 도구가 아니라 과제 도구로 본다",
      body: '창업지원단 쪽은 검증 정확도보다 "팀들이 뭐라도 해오게 만드는 것"을 먼저 봤다. 아이디어에 없던 쓰임새이고, 기관 영업의 진입점이 될 수 있다.',
      source: "쟁점 01 · 김태현",
    },
    {
      title: "인터뷰 경험이 많을수록 반대한다",
      body: "경험이 없는 쪽은 바로 써보겠다고 했고, 30명 넘게 해본 쪽이 가장 강하게 반대했다. 초기 사용자와 설득해야 할 사람이 다른 그룹이라는 뜻이다.",
      source: "쟁점 01 · 세 명 비교",
    },
  ],
  followUps: [
    { personaId: "p2", question: "그 2초 멈칫하는 걸 리포트로 보여줄 수 있다면, 생각이 달라지나요?" },
    { personaId: "p3", question: "사전 과제로 쓴다면 팀당 얼마까지 가능한가요?" },
    { question: "무료로 한 번 써본 뒤 어떤 일이 생겨야 돈을 낼까요?" },
  ],
  openQuestions: ["실제로 돈을 낼지", "한 번 써보고 다시 올지", "기관 계약이 가능한 절차인지"],
  meetWho: ["최근 3개월 안에 지원서를 써본 20대 3명", "인터뷰를 10회 이상 해본 창업자 1명", "창업지원기관 담당자 1명"],
  meetQuestions: [
    "가장 최근에 타깃을 정해야 했을 때, 실제로 무엇을 보고 정했나요?",
    "고객 인터뷰를 하려다 못 한 적이 있나요? 그때 뭐가 걸렸나요?",
    '인터뷰가 끝나고 "이것도 물어볼걸" 했던 적이 있나요? 그때 어떻게 했나요?',
    "이런 도구에 돈을 쓴다면 그 결정은 누가 하나요?",
  ],
  createdAt: "2026-10-03T10:00:00+09:00",
};

# 작업 이어받기

이 프로젝트를 처음 받았거나, 한참 손 놓았다가 다시 잡을 때 읽는 문서.
**무엇이 되어 있고 무엇이 남았는지, 어떤 방식으로 짜면 되는지**를 적어둔다.

## 0. 띄워보기

```bash
npm install
cp .env.example .env.local   # LLM_BASE_URL 은 AI팀 엔드포인트가 정해지면 채운다
npm run dev
```

http://localhost:3000/targets 가 뜨면 성공이다.
LLM 엔드포인트가 비어 있어도 화면은 돈다 — 더미 데이터로 그리게 해뒀다.

## 1. 읽는 순서

| 순서 | 문서 | 왜 |
|---|---|---|
| 1 | `CLAUDE.md` | 서비스가 뭔지, 디자인·카피·접근성 규칙, 화면별 핵심 규칙 |
| 2 | `docs/DECISIONS.md` | 왜 이렇게 만들었는지, **이미 폐기한 안** |
| 3 | `design/screens/*.html` | 화면 12개 원본. 브라우저에서 그냥 열린다 |

`DECISIONS.md`의 "폐기한 안" 표를 꼭 보고 넘어간다. 이미 접은 방향을 다시 꺼내면
시간이 두 번 든다.

---

## 2. 지금 어디까지 되어 있나

### 끝난 화면

| 화면 | 경로 | 파일 |
|---|---|---|
| 01 아이디어 입력 | `/new` | `(app)/new/IdeaFormClient.tsx` |
| 02 타깃 추천·선택 | `/targets` | `(app)/targets/TargetsClient.tsx` |
| 02-1 직접 만들기 | `/targets/new` | `(app)/targets/new/CreateTargetClient.tsx` |
| 03 한눈에 보기 | `/compare` | `(app)/compare/CompareClient.tsx` |
| 랜딩 | `/` | `(landing)/page.tsx` |

### 남은 화면 — 이 순서를 권한다

| 순서 | 시안 | 경로 | 메모 |
|---|---|---|---|
| 1 | `07-loading-targets.html` | — | 01 → 02 사이 대기 화면 |
| 2 | `06-empty.html` | — | 빈 상태 |
| 3 | `08-error.html` | — | 에러 상태 |
| 4 | `07-1-loading-chat.html` | — | 발화 대기 |
| 5 | `04-chat.html` | `/chat` | **제일 무겁다.** 상태 관리 + 스트리밍 |
| 6 | `04-1-chat-dm.html` | `/chat` | 1:1 오른쪽 패널. 04 와 같은 화면 |
| 7 | `07-2-loading-report.html` | — | 리포트 생성 대기 |
| 8 | `05-report.html` | `/report` | 306줄, 가장 복잡 |

**06·07·08 을 먼저 하라고 권하는 이유**: 단순하고 독립적이라 빨리 끝나고,
04·05 작업 중에 "로딩은 뭘 보여주지?"로 막히지 않는다.

### 아직 없는 것

- `src/app/api/chat/route.ts` 는 스텁이다. 실제 LLM 호출이 없다
- 데이터 저장이 없다. 01 입력만 브라우저에 임시 저장된다
- 화면 사이 데이터가 안 넘어간다. 각 화면이 `src/lib/mock.ts` 를 직접 읽는다
- 모바일 레이아웃(390) 없음. 데스크톱 1440 만 있다

---

## 3. 화면 만드는 방식 — 먼저 만든 네 개가 이렇게 되어 있다

### 파일 두 개로 나눈다

`page.tsx` 는 서버 컴포넌트로 두고(`metadata` 때문에), 상태가 필요한 부분만
클라이언트 컴포넌트로 뺀다.

```tsx
// page.tsx  — 서버
export const metadata: Metadata = { title: "타깃 설정" };
export default function Page() {
  return (<><AppHeader current="02" /><TargetsClient /></>);
}

// TargetsClient.tsx — 클라이언트
"use client";
export function TargetsClient() { ... }
```

헤더가 상태를 알아야 하면(01 의 "방금 저장됨") 헤더까지 클라이언트 쪽에서 그린다.

### 쓸 수 있는 공통 컴포넌트

| 컴포넌트 | 쓰임 |
|---|---|
| `AppHeader` | 상단 바. `current="04"` 로 단계 표시, `right` 에 추가 요소 |
| `PersonaCard` | 페르소나 카드. `readOnly` 로 버튼 없이도 쓴다 |
| `PersonaAvatar` | 색 + 이니셜 동그라미. 이름은 **반드시 옆에 같이** 표시 |
| `Chip` | `tone="neutral" | "conflict" | "agree" | "action" | "solid"` |
| `AttrRow` | mono 라벨 + 값. 칩이 들어가면 `align="start"` |
| `EditableChips` | 지울 수 있는 칩 + 추가 입력 |
| `PageFooterBar` | 하단 바. `title` `description` + 오른쪽 버튼 |

### 색은 토큰 유틸리티로만

**hex 를 한 글자도 쓰지 않는다.** 시안의 hex 를 아래로 바꿔 쓴다.

```
#FFFFFF bg-base      #E1E6ED border-card     #101828 text-ink
#F5F7FA bg-alt       #E4E8EE border-line     #344054 text-ink-2
#F8FAFC bg-panel     #EBEFF4 border-divider  #475467 text-ink-3
#F1F4F8 bg-bubble    #D5DCE5 border-input-border  #667085 text-muted
#EDF1F6 bg-th        #C8D1DC border-btn-border
#FAFBFD bg-input     #0A57C4 bg-brand / text-brand
#F6F9FF bg-hl        #EEF4FE bg-action-bg · #C7DBFA border-action-border
#FDF1E7 bg-conflict-bg · #9A461A text-conflict-fg
#E8FAEC bg-agree-bg  · #0B7A1B text-agree-fg
페르소나 5색: bg-persona-1 ~ 5 / border-persona-1 ~ 5
```

SVG 의 `stroke` 처럼 유틸리티가 안 먹는 자리는 `stroke="var(--brand)"` 로 쓴다.
토큰에 없는 색이 시안에 나오면 **새로 만들지 말고 가장 가까운 의미 토큰**을 쓴다.
(03 에서 `#E3ECFB` 대신 `bg-action-bg` 를 쓴 것이 그 예다.)

다 만들고 나서 확인:

```bash
grep -rn '#[0-9A-Fa-f]\{6\}' src --include=*.tsx
```

### 문구는 계산해서 만든다

하단 문구나 배너처럼 "데이터에 따라 달라지는 말"은 하드코딩하지 않는다.
02 와 03 이 그렇게 되어 있다 — 고른 사람들의 관심사·걱정이 실제로 갈리는지 보고
문장을 만들고, 비슷하면 "의견이 잘 안 갈릴 수 있어요"가 같은 자리에 뜬다.
하드코딩하면 데이터가 바뀔 때 화면이 거짓말을 한다.

### 합치기 전에 세 개

```bash
npm run typecheck
npm run lint
npm run build
```

`npm run dev` 를 띄워놓고 실제로 눈으로도 본다.

---

## 4. 남은 화면별 메모

**07 로딩 3종** — 페르소나가 순차로 말해 대기가 길다. 스피너 하나로 때우지 않는다.
지금 누가 말하려는 중인지 색 + 이니셜 + 이름으로 보여주고, 라운드 진행도 보이면 좋다.

**04 대화** — 단체 대화(1:3)가 메인이고 1:1 은 오른쪽 460px 패널로 연다(`04-1`).
**1:1 패널이 열려 있는 동안 단체 대화는 멈추고, 멈췄다는 것을 화면에 표시한다.**
안 읽은 메시지가 쌓이면 사용자가 놓친 걸 모른다.

**05 리포트** — 쟁점 단위로 정리한다. 쟁점 → 각자의 입장 → 왜 갈렸는지 해석.
마지막 **"이번 대화로는 알 수 없는 것"을 비우지 않는다.** 전부 답한 척하는 리포트가
가장 의심받는다.

**오케스트레이터** (`api/chat/route.ts`) — 모델은 AI팀이 정한다. 여기서는 AI팀이 준
엔드포인트를 부를 뿐이고 어떤 모델인지 가정하지 않는다. 토큰 단위 SSE 스트리밍,
라운드 구조(첫 반응 → 상호 토론 → 자유 질문), 쟁점은 대화 중에 미리 태깅.

---

## 5. 자주 틀리는 것

- **Tailwind v4 에는 `tailwind.config.js` 가 없다.** 설정은 `src/app/globals.css` 의
  `@theme inline` 안에 있다. 검색해서 나온 v3 기준 글을 그대로 따르지 말 것
- **다크 모드를 만들지 않는다.** `prefers-color-scheme` 블록을 추가하지 말 것
- **그림자를 쓰지 않는다.** 구분은 1px 테두리로만
- **페르소나에 파란색·초록색을 쓰지 않는다.** 브랜드색과 충돌한다. 정해진 5색만
- **분류 배지를 화면에 노출하지 않는다.** "핵심 타깃", "회의적 타깃" 은 폐기됐다
- **걱정을 비우지 않는다.** 비면 그 페르소나가 무조건 좋다고만 말한다
- **색만으로 정보를 전달하지 않는다.** 페르소나는 색 + 이니셜 + 이름 3중
- 버튼·터치 영역은 44px 이상. 아이콘 전용 버튼에는 `aria-label`
- `<div onClick>` 금지. 진짜 `<button>` `<a href>` `<input>`+`<label>`
- 카피에 "인터뷰를 대체한다"는 인상을 주지 않는다

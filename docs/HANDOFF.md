# Claude Code 이어받기

이 레포에서 Claude Code로 작업을 이어갈 때 쓰는 문서. 순서대로 복붙하면 된다.

## 0. 먼저

```bash
cd SW-Festival
npm install
cp .env.example .env.local   # LLM_BASE_URL 은 AI팀 엔드포인트가 정해지면 채운다
npm run dev
claude
```

`CLAUDE.md`는 Claude Code가 자동으로 읽는다. `docs/DECISIONS.md`는 직접 읽으라고 말해줘야 한다.

## 1. 첫 대화 — 맥락 주입

```
이 프로젝트를 이어서 개발할 거야.
CLAUDE.md 와 docs/DECISIONS.md 를 먼저 읽고,
design/screens/ 안의 HTML 시안 6개를 훑어봐.

그다음 네가 이해한 걸 정리해줘:
- 이 서비스가 뭘 하는 건지
- 확정된 것과 미결인 것
- 지금 코드가 어디까지 되어 있는지
```

**이해한 내용이 문서와 다르면 바로잡고 넘어간다.** 여기서 어긋나면 이후 작업이 전부 틀어진다.

## 2. 화면 이식 — 02번부터

```
design/screens/02-targets.html 을 /targets 페이지로 옮겨줘.

- 색은 전부 Tailwind 토큰 유틸리티로 (bg-brand, text-muted, bg-persona-1 ...).
  hex 를 하나도 남기지 마
- 반복되는 카드는 src/components/PersonaCard.tsx 로 빼줘
- 데이터는 일단 src/lib/mock.ts 에 더미로 두고, 타입은 src/lib/types.ts 를 써줘
- 분류 배지(핵심/회의적 등)는 화면에 노출하지 마. DECISIONS.md 5번 참고
```

02를 먼저 하는 이유는 공통 컴포넌트가 거의 다 여기 있어서다.
`AppHeader` `PersonaCard` `AttrRow` `Chip` `PersonaAvatar` `PageFooterBar`

이후 순서: `02-1 → 03 → 01 → 04 → 05`
04(대화)와 05(리포트)는 상태 관리가 필요하니 나중에.

## 3. 로딩 상태 — 시안이 없는 화면

```
페르소나 3명이 순차로 말하는 동안 보여줄 로딩 상태를 만들어줘.
시안이 없으니 CLAUDE.md 의 디자인 규칙에 맞춰 네가 설계해도 돼.

- 지금 누가 말하려는 중인지 보여야 함 (색 + 이니셜 + 이름)
- 라운드 진행 상황이 보이면 좋음
- 스피너 하나로 때우지 마. 3명이 순차라 대기가 길다
```

## 4. 오케스트레이터

```
src/app/api/chat/route.ts 의 스텁을 실제 구현으로 바꿔줘.

- Anthropic SDK 로 호출, 키는 서버에서만
- 토큰 단위 SSE 스트리밍
- 라운드 구조: 첫 반응 → 상호 토론 → 자유 질문
- 페르소나는 자기 카드 밖 정보를 지어내지 않아야 함
- 쟁점은 대화 중에 미리 태깅해 둘 것. 리포트 생성 때 한 번에 뽑으면 품질이 들쑥날쑥해짐
  (DECISIONS.md 7번 참고)
```

---

## 자주 틀리는 것

- **Tailwind v4에는 `tailwind.config.js`가 없다.** 설정은 `src/app/globals.css`의 `@theme inline` 안에 있다. 검색해서 나온 v3 기준 글을 그대로 따르지 말 것
- **다크 모드를 만들지 않는다.** `prefers-color-scheme` 블록을 추가하지 말 것
- **그림자를 쓰지 않는다.** 구분은 1px 테두리로만
- **페르소나에 파란색·초록색을 쓰지 않는다.** 브랜드색과 충돌한다. 정해진 5색만
- 카피에 "인터뷰를 대체한다"는 인상을 주지 않는다

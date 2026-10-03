# Soul

**예비창업자를 위한 다중대화 타깃 검증 서비스**

첫 고객 인터뷰 전에 리허설하고, 다녀온 뒤 다시 묻는 도구.

아이디어를 적으면 타깃 후보를 찾아주고, 그 타깃들이 한 방에 모여 서로의 말을 들으며 답합니다.
인터뷰를 대신하지 않습니다. 앞뒤를 채웁니다.

## 시작하기

```bash
npm install
cp .env.example .env.local   # LLM_BASE_URL 은 AI팀 엔드포인트가 정해지면 채운다
npm run dev
```

http://localhost:3000

엔드포인트가 비어 있어도 화면은 돕니다. 스텁이 응답하도록 해뒀습니다.

## 스택

- Next.js 16 (App Router, Turbopack) · React 19 · TypeScript
- Tailwind CSS v4 — 설정은 CSS 안에 있다 (`src/app/globals.css` 의 `@theme inline`)
- 폰트: IBM Plex Sans KR + IBM Plex Mono (`next/font`로 빌드 시 자체 호스팅)

## 구조

```
src/
  app/
    (landing)/page.tsx      /            랜딩
    (app)/
      layout.tsx
      new/                  /new         01 아이디어 입력
      targets/              /targets     02 타깃 추천·선택
      targets/new/          /targets/new 02-1 직접 만들기
      compare/              /compare     03 한눈에 보기
      chat/                 /chat        04 대화
      report/               /report      05 리포트
    api/chat/route.ts       페르소나 발화 스트리밍 (스텁)
    globals.css             토큰 → Tailwind 유틸리티 연결
    layout.tsx              폰트, 메타데이터
  components/               AppHeader, PersonaAvatar, Chip, AttrRow, PageFooterBar
  lib/types.ts              Idea, Persona, Room, Message, Issue, Report
  styles/tokens.css         색·폰트·radius 단일 출처
public/                     정적 파일
design/
  screens/                  화면 12개 정적 시안 (브라우저에서 바로 열림)
  README.md                 시안 읽는 법, 컴포넌트 분해안
docs/
  DECISIONS.md              결정과 그 이유, 폐기한 안, 미결 사항
  HANDOFF.md                합류·재개용 — 지금 상태와 다음 작업 순서
CLAUDE.md                   디자인·카피·접근성 규칙 (작업 전 필독)
.env.example                필요한 환경변수 목록
```

설정 파일은 루트에 있다 — `next.config.ts`, `tsconfig.json`,
`postcss.config.mjs`, `eslint.config.mjs`.
Tailwind v4 라서 `tailwind.config.ts` 는 없다.

## 규칙 요약

전문은 `CLAUDE.md`. 자주 어기는 것만 추려두면:

- 색은 `tokens.css` 변수로만. hex 하드코딩 금지
- 라이트 전용. 다크 모드 만들지 않는다
- 그림자 금지. 구분은 1px 테두리로만
- 페르소나는 정해진 5색만. 파랑·초록은 브랜드색이라 안 쓴다
- 색만으로 정보 전달 금지 — 색 + 이니셜 + 이름
- 걱정되는 점을 비우지 않는다. 비면 그 사람이 반대할 근거가 없어진다
- LLM 호출은 서버에서만. `NEXT_PUBLIC_` 에 키를 넣지 않는다
- 카피에서 "인터뷰를 대체한다"는 인상을 주지 않는다

## 팀 경계

모델 선택과 학습은 AI팀이 합니다. 웹은 AI팀이 준 엔드포인트 하나만
`src/app/api/chat/route.ts` 에서 호출하고, 그 뒤에 어떤 모델이 있는지 가정하지 않습니다.
그래서 환경변수 이름에도 제공사를 넣지 않았습니다.

## 브랜치 규칙

`main`은 항상 동작하는 상태로 둔다. 작업은 브랜치에서 하고 PR로 합친다.

```
feat/타깃-화면      기능 추가
fix/스트리밍-끊김   버그 수정
docs/스택-정리      문서만 바꿀 때
```

합치기 전에 세 개를 돌린다.

```bash
npm run typecheck
npm run lint
npm run build
```

브랜치를 이틀 이상 살려두지 않는다. 셋이 같은 코드를 만지면 오래 산 브랜치는 반드시 충돌한다.
리뷰어가 없으면 셀프 머지해도 되지만, PR은 남긴다.

## 다음 할 일

- [ ] 화면 이식 — `02-targets` 부터 (공통 컴포넌트가 거의 다 여기 있다)
- [ ] 로딩 상태 3종 — 시안이 나왔다 (`07`, `07-1`, `07-2`)
- [ ] 빈 상태 / 에러 상태 (`06`, `08`)
- [ ] 오케스트레이터 — 발화 순서, 라운드 관리, 쟁점 태깅
- [ ] 모바일 레이아웃 (390)

## 라이선스

MIT — `LICENSE` 참고.

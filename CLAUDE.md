# TargetTable

> 레포 이름은 `SW-Festival`이지만 서비스 이름은 **TargetTable(타깃테이블)**이다. (구 이름: Persona Studio — 코드·문구에 쓰지 않는다)

## 한 줄 정의

첫 고객 인터뷰를 앞둔 예비창업자가 **AI 페르소나 여러 명과 한 번에 대화**해서,
"누구를 만나서 무엇을 물어봐야 하는지" 알게 해주는 **인터뷰 리허설·재질문 도구**.

- 실제 고객 인터뷰를 **대체하지 않는다.** 인터뷰 *전* 리허설, 인터뷰 *후* 다시 물어보기용이다.
- 핵심 세 가지: **AI 페르소나 / 다중대화 / 고객검증**
- 가치의 중심: 서로 다른 타깃의 의견을 한 자리에서 듣고, **의견이 갈리는 지점**을 보는 것.
  ChatGPT 1:1로는 못 얻는 게 이것이고, 제품의 존재 이유다.

## 사용자

- 1차 고객: 고객 인터뷰를 아직 한 번도 못 해본 **20대 예비창업자**
- 돈 내는 쪽(후순위): 창업지원기관(B2B 기관 라이선스) → 이후 개인 구독으로 확장
- MVP에서는 결제·기관 관리 기능을 만들지 않는다.

## 사용자 흐름 (MVP 5단계)

```
① 아이디어 입력 → ② 타깃 추천·수정·직접 만들기 → ③ 고른 세 명 한눈에 보기
→ ④ 대화 (단체 1:3 메인 + 1:1 오른쪽 패널) → ⑤ 리포트
```

화면별 상세 명세: `docs/DECISIONS.md` 3절 · 화면 원본: `design/screens/*.html`

## MVP에서 반드시 유지하는 것 (빼지 말 것)

- 모두의창업 지원서 양식을 따른 **문항별** 아이디어 입력 (한 칸짜리 입력으로 줄이지 않는다)
- 타깃 **AI 추천 5명 + 수정 + 직접 만들기** (하이브리드)
- **단체 대화(1:3)와 1:1 대화 둘 다**
- 리포트의 **"의견이 갈린 부분"** — 다중대화만의 차별점이라 MVP에서도 필수

## 절대 원칙

1. **AI가 만든 티 나는 말 금지.** "가장 강한 신호", "반응 온도", "검증 보드", "인사이트 스코어" 같은 조어 대신
   "세 명 모두 공감한 부분", "의견이 갈린 부분", "생각이 바뀐 순간"처럼 평범한 한국어. → `docs/DESIGN.md` 언어 원칙
2. **타깃은 정답이 아니라 후보(가설)다.** "당신의 타깃입니다"가 아니라 "이런 사람이 타깃일 수 있어요".
3. **분류 배지를 화면에 노출하지 않는다.** ("핵심 타깃", "회의적 타깃" 같은 라벨 X) 추천 이유는 평범한 한 문장.
4. **시큰둥한 사람 최소 1명**은 추천 5명 안에 항상 포함 (사용자에게 안 보이는 내부 규칙). 안 그러면 LLM 특성상 전부 "좋은데요?"가 된다.
5. **AI 대화 결과를 실제 검증처럼 포장하지 않는다.** 리포트 끝은 항상 "실제 사람에게 물어볼 것"으로 연결하고, 가상 인물이라는 고지를 둔다.
6. 페르소나 발언 중 **카드에 없는 경험을 지어낸 부분은 리포트 인용에 쓰지 않는다.**
7. **입장 변화는 이유를 밝히고 바뀐 경우만** 집계한다. 분위기에 맞춘 동의(sycophancy)는 품질 문제로 로깅.

AI 쪽 규칙 상세: `docs/DECISIONS.md` 7절

## 디자인 요약 (상세: `docs/DESIGN.md`)

- **라이트 테마 전용. 다크 모드 만들지 않는다.**
- 브랜드 블루: UI에는 `#0A57C4` (순수 네이버 블루 `#0277FC`는 대비 미달이라 로고 마크 외 사용 금지)
- 쿨 그레이 중립, 그림자 없이 1px 테두리
- 폰트: **IBM Plex Sans KR**(본문·제목) + **IBM Plex Mono**(라벨·숫자). Pretendard / Inter / Roboto 사용 금지
- 페르소나 색은 지정된 5색만 사용
- 이모지 아이콘 금지 (선 SVG 아이콘), 터치 영역 최소 44px

색 변수의 단일 출처는 `src/styles/tokens.css`. 하드코딩한 hex를 쓰지 않는다.

## 기술 스택

> 2026-09-29 확정. 바꾸려면 먼저 제안하고 이유를 말한다.

| 항목 | 확정 내용 |
|---|---|
| 형태 | 웹 서비스 |
| 프론트엔드 | Next.js 16 (App Router, Turbopack) + React 19 + TypeScript |
| 스타일 | Tailwind CSS v4 — 설정은 `src/app/globals.css`의 `@theme inline`. `tailwind.config.ts`는 없다 |
| 백엔드 | 별도 서버를 두지 않는다. Next.js Route Handler(`src/app/api/`)가 백엔드다 |
| LLM | **EXAONE / Qwen 계열 — AI팀이 고르고 서빙한다.** 웹팀은 AI팀 엔드포인트로 호출만 한다 |
| LLM 연동 | 서빙 방식 **확인 필요** (자체 호스팅인지 외부 API인지, OpenAI 호환 규격인지) |
| 스트리밍 | SSE. 페르소나가 순차 발화하므로 토큰 단위로 흘려보낸다 |
| 저장 | Postgres (대화 로그를 구조화 저장). 호스팅은 배포처 정할 때 함께 결정 |
| 로그인 | MVP에서 만들지 않는다. 익명 세션 ID로 묶는다 |
| 배포 | 미정 — Vercel 유력. 순차 발화가 길어 함수 실행 시간 제한을 먼저 확인할 것 |

**왜 이렇게 정했나**

- **한 앱으로 간다.** 화면 6개에 스트리밍 엔드포인트 하나가 전부라, 프론트/백을 나누면 CORS와 배포 2벌이 생긴다. MVP 일정에 불리하다.
- **폰트가 결정적이었다.** `next/font`가 IBM Plex Sans KR을 빌드 시 자체 호스팅한다. 한글 웹폰트는 무거워서 CDN으로 불러오면 첫 화면이 늦는데, 이 방식이면 그 문제가 없다. 디자인 규칙의 폰트 요구와 정확히 맞는다.
- **스트리밍이 기본으로 된다.** Route Handler가 `ReadableStream`을 그대로 반환할 수 있어 SSE에 별도 장치가 필요 없다.
- **저장을 서버에 두는 이유.** 대화 로그가 리포트의 재료이면서 이후 평가셋의 원천이다. 브라우저 임시 저장으로 시작하면 이 데이터가 남지 않는다.

**LLM 연동 — 웹팀과 AI팀의 경계**

모델은 AI팀이 고르고 서빙한다. 웹팀은 모델을 직접 부르지 않고, **AI팀이 준 엔드포인트 하나만** 바라본다.

```
브라우저 → Next.js Route Handler → (AI팀 추론 서버) → 모델
```

- 웹팀이 책임지는 것: 화면, 대화 UI, SSE 중계, 대화 로그 저장, 리포트 화면
- AI팀이 책임지는 것: 모델 선택·서빙, 프롬프트, 오케스트레이션(발화 순서·라운드), 쟁점 태깅
- 경계는 **엔드포인트 하나**. 이게 정해지기 전까지 웹팀은 스텁으로 개발한다.

**AI팀에 확인해야 할 것** (정해지면 이 표를 채운다)

- 엔드포인트 주소와 인증 방식
- 요청·응답 형식 — OpenAI 호환(`/v1/chat/completions`)이면 그대로 쓸 수 있다
- 스트리밍 지원 여부와 형식 (SSE `data:` 청크인지)
- 페르소나 3명 순차 발화를 **누가** 돌리는지 — AI팀 서버가 한 번에 처리하는지, 웹팀이 3번 부르는지
- 동시 요청 한도와 응답 지연 (순차 발화라 누적된다)

환경변수는 제공사에 매이지 않게 `LLM_` 접두사로 둔다. 키는 서버에서만 읽고 `NEXT_PUBLIC_`을 붙이지 않는다.

## 작업 규칙

- UI 문구는 한국어, 존댓말 "~해요" 체. 화면 원본(`design/screens/`)의 문구를 기준으로 삼는다.
- API 키 등 비밀값은 `.env`로만 다루고 커밋하지 않는다.
- LLM 프롬프트는 코드에 흩어두지 말고 한 곳(`prompts/`)에 모아 버전 관리한다. 나중에 평가셋·파인튜닝 데이터로 이어진다.
- 대화 로그(누가, 몇 라운드에, 무슨 말을, 입장 변화 여부)는 구조화해서 남긴다. 리포트 생성과 이후 평가에 쓰인다.
- 기능을 줄이거나 흐름을 바꿔야 할 것 같으면 **바꾸기 전에 먼저 제안**하고 이유를 말한다.
- 확실하지 않은 건 추측으로 채우지 말고 "미정/확인 필요"로 남긴다.

## 참고 문서

| 파일 | 내용 |
|---|---|
| `docs/DECISIONS.md` | 배경, 고객, 화면별 확정 사항, 리포트 구성, 폐기한 안, LLM 로드맵 |
| `docs/DESIGN.md` | 색·타이포·레이아웃 토큰, 접근성, 언어 원칙 |
| `docs/HANDOFF.md` | 작업 이어받는 법 (복붙용 프롬프트) |
| `design/screens/*.html` | 화면 6개 설계 원본 (마크업·스타일 참고용, 그대로 렌더되지 않음) |
| `src/styles/tokens.css` | 색 변수 구현 |

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

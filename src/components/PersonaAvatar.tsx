import type { Archetype, Persona, PersonaColor } from "@/lib/types";

const BG: Record<PersonaColor, string> = {
  1: "bg-persona-1",
  2: "bg-persona-2",
  3: "bg-persona-3",
  4: "bg-persona-4",
  5: "bg-persona-5",
};

const SIZE = {
  sm: "size-6",
  md: "size-8",
  lg: "size-[38px]",
} as const;

/** 얼굴을 그릴 때 쓰는 카드 값. 없으면 이름으로만 정한다 */
export type AvatarFace = Partial<Pick<Persona, "id" | "gender" | "age" | "archetype">>;

/**
 * 페르소나 얼굴. 실제 사람 사진처럼 보이면 "AI가 만든 가짜 사람"으로 읽혀 대화에 몰입이 깨진다.
 * 그래서 굵은 선·점 눈의 만화 얼굴(윔피 키드풍)로 그린다.
 *
 * - 색만으로 사람을 구분하지 않는다: 배경색 + 사람마다 다른 얼굴(머리 모양·안경) + 옆에 이름 (CLAUDE.md 7절)
 * - 머리 모양은 성별·나이, 세부(안경·머리 변형)는 id 로 고정 — 같은 사람은 어느 화면에서나 같은 얼굴
 * - 표정은 원형(archetype)을 살짝 드러낸다: 혁신가 활짝, 비전가 씩, 실용 미소, 보수 작은 미소, 회의 한쪽 눈썹
 * 이름은 이 컴포넌트 밖에서 반드시 같이 표시한다.
 */
export function PersonaAvatar({
  name,
  color,
  size = "md",
  face,
}: {
  name: string;
  color: PersonaColor;
  size?: keyof typeof SIZE;
  face?: AvatarFace;
}) {
  const seed = hash(face?.id ?? name);
  const female = face?.gender === "여";
  const older = (face?.age ?? 0) >= 38;
  const hair = female ? FEMALE_HAIR[seed % FEMALE_HAIR.length] : older ? "receding" : MALE_HAIR[seed % MALE_HAIR.length];
  const glasses = older || seed % 5 === 3;
  const expr = EXPRESSION[face?.archetype ?? "pragmatist"];

  return (
    <span aria-hidden="true" className={`flex shrink-0 overflow-hidden rounded-full ${BG[color]} ${SIZE[size]}`}>
      <svg
        viewBox="0 0 40 40"
        className="size-full"
        fill="none"
        stroke="var(--text)"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {HAIR_BACK[hair] && <path d={HAIR_BACK[hair]} fill="var(--text)" />}
        {/* 귀 · 머리 */}
        <path d="M9.7 20.3q-2.4 1.7 0 3.8M30.3 20.3q2.4 1.7 0 3.8" />
        <ellipse cx="20" cy="22" rx="10.4" ry="11.4" fill="var(--bg-base)" />
        {HAIR_FRONT[hair] && <path d={HAIR_FRONT[hair]} fill="var(--text)" />}
        {HAIR_LINES[hair] && <path d={HAIR_LINES[hair]} />}
        {/* 눈 · 안경 · 눈썹 · 입 */}
        <circle cx="16.3" cy="22.2" r="1.15" fill="var(--text)" stroke="none" />
        <circle cx="23.7" cy="22.2" r="1.15" fill="var(--text)" stroke="none" />
        {glasses && (
          <path
            d="M13.3 22.2a3 3 0 1 0 6 0a3 3 0 1 0 -6 0M20.7 22.2a3 3 0 1 0 6 0a3 3 0 1 0 -6 0M19.3 22h1.4"
            strokeWidth="1.2"
          />
        )}
        <path d={expr.brows} strokeWidth="1.3" />
        <path d={expr.mouth} fill={expr.open ? "var(--bg-base)" : "none"} />
      </svg>
    </span>
  );
}

type Hair = "greg" | "sidePart" | "buzz" | "receding" | "long" | "bob" | "ponytail";
const MALE_HAIR: Hair[] = ["greg", "sidePart", "buzz"];
const FEMALE_HAIR: Hair[] = ["long", "bob", "ponytail"];

/** 머리 뒤로 내려오는 머리카락 (얼굴보다 먼저 그린다) */
const HAIR_BACK: Partial<Record<Hair, string>> = {
  long: "M8.6 22C8 11 14 9 20 9s12 2 11.4 13l.6 11.5h-4.5l.1-9.5H12.4l.1 9.5H8z",
  bob: "M9 27C7.8 12 14 9.2 20 9.2S32.2 12 31 27h-2.6l-.4-5H12l-.4 5z",
  ponytail: "M28.6 12.6c5.6-.4 6.8 5 4.6 11.8-1-4.2-2.2-6.6-4.4-7.8z",
};

/** 얼굴 위에 덮는 머리카락 */
const HAIR_FRONT: Partial<Record<Hair, string>> = {
  sidePart:
    "M9.7 20.6C9 12 15 9.6 21 10c6 .3 10.2 3.5 9.6 10.5-2.1-3.7-6.1-5.3-10.1-4.9-3.5.3-5.7-.8-6.9-2-1 2.4-2.4 4.7-3.9 7z",
  buzz: "M10.4 18.6C11 12.5 15.5 10.5 20 10.5s9 2 9.6 8.1c-3.5-2.9-15.7-2.9-19.2 0z",
  receding:
    "M9.8 19.8c.2-3.3 1.8-5.2 3.6-5.8-.8 2-1.4 4-1.8 6.6zM30.2 19.8c-.2-3.3-1.8-5.2-3.6-5.8.8 2 1.4 4 1.8 6.6z",
  long: "M9.8 20.5C9.6 12.5 15 10 20 10s10.4 2.5 10.2 10.5c-2.4-3.5-6.2-4.7-8.7-5.9-2 2.4-7 3-11.7 5.9z",
  bob: "M10 19c.5-6.2 5-8.8 10-8.8s9.5 2.6 10 8.8z",
  ponytail: "M9.9 20C9.8 12.6 14.8 10.2 20 10.2s9.9 2.4 10.1 9.3c-3-3.6-9.6-5.2-13.6-3.4-2.4 1-4.4 2.3-6.6 3.9z",
};

/** 선으로만 그리는 머리카락 — 윔피 키드의 그 세 가닥 */
const HAIR_LINES: Partial<Record<Hair, string>> = {
  greg: "M17.6 10.9l-1.3-3.4M20.3 10.5l.2-3.8M23 10.9l1.6-3.2",
  receding: "M19.4 10.7q.6-1.8 1.8-2.4",
};

const EXPRESSION: Record<Archetype, { brows: string; mouth: string; open?: boolean }> = {
  // 새로우면 일단 신난다
  innovator: { brows: "M14.6 18.6q1.7-1.4 3.4 0M22 18.6q1.7-1.4 3.4 0", mouth: "M16.6 26.4q3.4 4.2 6.8 0z", open: true },
  // 확신에 찬 한쪽 미소
  visionary: { brows: "M14.6 18.9l3.3-.6M22.1 18.3l3.3.6", mouth: "M17.4 27.4q3.2 1.1 5.4-1.4" },
  // 차분한 미소
  pragmatist: { brows: "M14.7 18.9h3.2M22.1 18.9h3.2", mouth: "M17.5 27q2.5 1.8 5 0" },
  // 조심스러운 작은 미소
  conservative: { brows: "M14.7 18.6l3.2.6M22.1 19.2l3.2-.6", mouth: "M18.4 27.2q1.6.8 3.2 0" },
  // 한쪽 눈썹을 올리고 입은 일자
  skeptic: { brows: "M14.7 19.1h3.2M22.1 18.2l3.2-1", mouth: "M17.7 27.5h4.6" },
};

function hash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

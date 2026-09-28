import type { PersonaColor } from "@/lib/types";

const BG: Record<PersonaColor, string> = {
  1: "bg-persona-1",
  2: "bg-persona-2",
  3: "bg-persona-3",
  4: "bg-persona-4",
  5: "bg-persona-5",
};

const SIZE = {
  sm: "size-6 text-[10px]",
  md: "size-8 text-xs",
  lg: "size-[38px] text-sm",
} as const;

/**
 * 색만으로 사람을 구분하지 않기 위해 이니셜을 항상 함께 보여준다.
 * 이름은 이 컴포넌트 밖에서 반드시 같이 표시한다.
 */
export function PersonaAvatar({
  name,
  color,
  size = "md",
}: {
  name: string;
  color: PersonaColor;
  size?: keyof typeof SIZE;
}) {
  return (
    <span
      aria-hidden="true"
      className={`flex shrink-0 items-center justify-center rounded-full font-semibold text-white ${BG[color]} ${SIZE[size]}`}
    >
      {name.slice(-2, -1) || name.slice(0, 1)}
    </span>
  );
}

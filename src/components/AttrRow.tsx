/** 라벨(mono) + 값 한 줄. 카드와 비교표에서 같은 모양으로 쓴다. */
export function AttrRow({
  label,
  children,
  labelWidth = "w-21",
}: {
  label: string;
  children: React.ReactNode;
  labelWidth?: string;
}) {
  return (
    <div className="flex items-baseline gap-2.5">
      <div
        className={`${labelWidth} shrink-0 font-mono text-[11px] tracking-[0.06em] text-muted`}
      >
        {label}
      </div>
      <div className="grow text-sm leading-relaxed">{children}</div>
    </div>
  );
}
